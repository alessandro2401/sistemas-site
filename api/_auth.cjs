const crypto = require('node:crypto');

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'mutual_system_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const SCRYPT_KEY_LENGTH = 32;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const MAX_PASSWORD_LENGTH = 256;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT = 5;
const BLOCK_MS = 15 * 60 * 1000;

function sendJson(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(status).json(body);
}

function authConfig() {
  const email = String(process.env.AUTH_ADMIN_EMAIL || '').trim().toLowerCase();
  const passwordHash = String(process.env.AUTH_ADMIN_PASSWORD_HASH || '').trim();
  const sessionSecret = String(process.env.AUTH_SESSION_SECRET || '');
  if (!email || !passwordHash || sessionSecret.length < 32) {
    throw new Error('Authentication configuration is incomplete');
  }
  return {
    email,
    passwordHash,
    sessionSecret,
    name: process.env.AUTH_ADMIN_NAME || 'Diretoria',
    role: process.env.AUTH_ADMIN_ROLE || 'admin',
  };
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function requestIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  return String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function rateState() {
  if (!globalThis.__mutualSystemsAuthRate) globalThis.__mutualSystemsAuthRate = new Map();
  return globalThis.__mutualSystemsAuthRate;
}

function rateCheck(ip) {
  const now = Date.now();
  const state = rateState();
  const current = state.get(ip);
  if (!current || now - current.startedAt > RATE_WINDOW_MS) {
    state.set(ip, { startedAt: now, failures: 0, blockedUntil: 0 });
    return { allowed: true };
  }
  if (current.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((current.blockedUntil - now) / 1000) };
  }
  return { allowed: true };
}

function rateFailure(ip) {
  const now = Date.now();
  const state = rateState();
  const current = state.get(ip) || { startedAt: now, failures: 0, blockedUntil: 0 };
  if (now - current.startedAt > RATE_WINDOW_MS) {
    current.startedAt = now;
    current.failures = 0;
  }
  current.failures += 1;
  if (current.failures >= RATE_LIMIT) current.blockedUntil = now + BLOCK_MS;
  state.set(ip, current);
}

function rateSuccess(ip) {
  rateState().delete(ip);
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function base64urlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64urlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function safeEqualHex(leftHex, rightHex) {
  try {
    const left = Buffer.from(leftHex, 'hex');
    const right = Buffer.from(rightHex, 'hex');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function parseScryptHash(encoded) {
  const match = /^scrypt\$(\d+)\$(\d+)\$(\d+)\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/.exec(encoded);
  if (!match) return null;
  return {
    N: Number(match[1]),
    r: Number(match[2]),
    p: Number(match[3]),
    salt: Buffer.from(match[4], 'base64url'),
    digest: Buffer.from(match[5], 'base64url'),
  };
}

function verifyPassword(password, encoded) {
  const parsed = parseScryptHash(encoded);
  if (!parsed || parsed.salt.length < 16 || parsed.digest.length !== SCRYPT_KEY_LENGTH) return false;
  const derived = crypto.scryptSync(password, parsed.salt, parsed.digest.length, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    maxmem: 128 * parsed.N * parsed.r + 1024 * 1024,
  });
  return crypto.timingSafeEqual(derived, parsed.digest);
}

function createSession(config) {
  const payload = {
    email: config.email,
    name: config.name,
    role: config.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    nonce: crypto.randomBytes(16).toString('hex'),
  };
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', config.sessionSecret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function cookieValue(req) {
  const header = String(req.headers?.cookie || '');
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === COOKIE_NAME) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function readSession(req, config) {
  const token = cookieValue(req);
  if (!token) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;
  const expected = crypto.createHmac('sha256', config.sessionSecret).update(encodedPayload).digest('base64url');
  if (!safeEqualHex(Buffer.from(signature).toString('hex'), Buffer.from(expected).toString('hex'))) return null;
  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (!payload || payload.email !== config.email || Number(payload.exp) <= Math.floor(Date.now() / 1000)) return null;
    return { email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Strict`;
}

function handleLogin(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { success: false, error: 'Método não permitido.' });
  }
  const ip = requestIp(req);
  const rate = rateCheck(ip);
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(rate.retryAfter));
    return sendJson(res, 429, { success: false, error: 'Muitas tentativas. Aguarde e tente novamente.' });
  }

  let config;
  try { config = authConfig(); } catch (error) {
    console.error('Auth configuration error');
    return sendJson(res, 503, { success: false, error: 'Serviço de autenticação indisponível.' });
  }

  const body = parseBody(req);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const isValid = email === config.email && password.length > 0 && password.length <= MAX_PASSWORD_LENGTH && verifyPassword(password, config.passwordHash);
  if (!isValid) {
    rateFailure(ip);
    return sendJson(res, 401, { success: false, error: 'E-mail ou senha inválidos.' });
  }

  rateSuccess(ip);
  res.setHeader('Set-Cookie', sessionCookie(createSession(config)));
  return sendJson(res, 200, { success: true, user: { email: config.email, name: config.name, role: config.role } });
}

function handleMe(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { authenticated: false });
  }
  try {
    const session = readSession(req, authConfig());
    if (!session) return sendJson(res, 401, { authenticated: false });
    return sendJson(res, 200, { authenticated: true, user: session });
  } catch {
    return sendJson(res, 503, { authenticated: false });
  }
}

function handleLogout(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { success: false });
  }
  res.setHeader('Set-Cookie', clearSessionCookie());
  return sendJson(res, 200, { success: true });
}

module.exports = { handleLogin, handleMe, handleLogout };
