class AuthManager {
  constructor() {
    this.currentUser = null;
  }

  async checkSession() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) {
        this.currentUser = null;
        return false;
      }
      const payload = await response.json();
      this.currentUser = payload.authenticated ? payload.user : null;
      return Boolean(this.currentUser);
    } catch (_) {
      this.currentUser = null;
      return false;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) {
        return { success: false, message: payload.error || 'E-mail ou senha incorretos.' };
      }
      this.currentUser = payload.user || null;
      return { success: true, user: this.currentUser };
    } catch (_) {
      return { success: false, message: 'Não foi possível conectar ao servidor de autenticação.' };
    }
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
    } finally {
      this.currentUser = null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  safeNext(value) {
    try {
      const url = new URL(value || '', window.location.origin);
      if (url.origin === window.location.origin && url.pathname.startsWith('/')) return `${url.pathname}${url.search}${url.hash}`;
    } catch (_) {
      // Fall back to the portal home.
    }
    return '/index.html';
  }

  redirectToLogin() {
    const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.href = `/login.html?next=${encodeURIComponent(this.safeNext(next))}`;
  }

  redirectAfterLogin() {
    const next = new URLSearchParams(window.location.search).get('next');
    window.location.href = this.safeNext(next || '/index.html');
  }

  async protectPage() {
    const authenticated = await this.checkSession();
    if (!authenticated) {
      this.redirectToLogin();
      return false;
    }
    return true;
  }
}

window.authManager = new AuthManager();
