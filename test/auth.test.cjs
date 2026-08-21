const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { handleLogin, handleMe, handleLogout } = require('../api/_auth.cjs');

const password = 'Test-Strong-Password!2026';
const email = 'diretoria@administradoramutual.com.br';
const sessionSecret = 'test-session-secret-with-at-least-32-characters';

function hashPassword(value) {
  const salt = crypto.randomBytes(16);
  const digest = crypto.scryptSync(value, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 128 * 16384 * 8 + 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString('base64url')}$${digest.toString('base64url')}`;
}

function responseMock() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
  };
}

function request(method, body, ip = '198.51.100.10', headers = {}) {
  return { method, body, headers: { 'x-forwarded-for': ip, ...headers } };
}

function configure() {
  process.env.AUTH_ADMIN_EMAIL = email;
  process.env.AUTH_ADMIN_PASSWORD_HASH = hashPassword(password);
  process.env.AUTH_SESSION_SECRET = sessionSecret;
  process.env.AUTH_ADMIN_NAME = 'Diretoria';
  process.env.AUTH_ADMIN_ROLE = 'admin';
}

test('login válido emite sessão protegida', () => {
  configure();
  const res = responseMock();
  handleLogin(request('POST', { email, password }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.match(res.headers['set-cookie'], /HttpOnly/);
  assert.match(res.headers['set-cookie'], /Secure/);
  assert.match(res.headers['set-cookie'], /SameSite=Strict/);
  assert.match(res.headers['set-cookie'], /Max-Age=28800/);
});

test('login inválido retorna erro genérico', () => {
  configure();
  const res = responseMock();
  handleLogin(request('POST', { email, password: 'wrong-password' }, '198.51.100.11'), res);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { success: false, error: 'E-mail ou senha inválidos.' });
  assert.equal(res.headers['set-cookie'], undefined);
});

test('sessão emitida é reconhecida pelo endpoint me', () => {
  configure();
  const loginRes = responseMock();
  handleLogin(request('POST', { email, password }, '198.51.100.12'), loginRes);
  const meRes = responseMock();
  handleMe(request('GET', undefined, '198.51.100.12', { cookie: loginRes.headers['set-cookie'] }), meRes);
  assert.equal(meRes.statusCode, 200);
  assert.equal(meRes.body.authenticated, true);
  assert.equal(meRes.body.user.email, email);
});

test('logout limpa o cookie de sessão', () => {
  configure();
  const res = responseMock();
  handleLogout(request('POST'), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.match(res.headers['set-cookie'], /Max-Age=0/);
});

test('configuração ausente falha fechada', () => {
  delete process.env.AUTH_ADMIN_PASSWORD_HASH;
  process.env.AUTH_ADMIN_EMAIL = email;
  process.env.AUTH_SESSION_SECRET = sessionSecret;
  const res = responseMock();
  handleLogin(request('POST', { email, password }, '198.51.100.13'), res);
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.success, false);
});
