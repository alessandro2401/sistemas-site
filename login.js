function setError(message) {
  const error = document.getElementById('errorMsg');
  error.textContent = message;
  error.style.display = 'block';
}

async function initializeLogin() {
  const authenticated = await authManager.checkSession();
  if (authenticated) authManager.redirectAfterLogin();
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const button = document.getElementById('btnLogin');
  const error = document.getElementById('errorMsg');

  button.disabled = true;
  button.textContent = 'Verificando...';
  error.style.display = 'none';

  const result = await authManager.login(email, password);
  if (result.success) {
    button.textContent = 'Acesso liberado!';
    authManager.redirectAfterLogin();
    return;
  }

  setError(result.message);
  button.disabled = false;
  button.textContent = 'Entrar no Portal';
}

function togglePassword() {
  const input = document.getElementById('password');
  input.type = input.type === 'password' ? 'text' : 'password';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.querySelector('.toggle-password').addEventListener('click', togglePassword);
  void initializeLogin();
});
