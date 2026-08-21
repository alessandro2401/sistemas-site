async function initializePortal() {
  const allowed = await authManager.protectPage();
  if (!allowed) return;

  const user = authManager.getCurrentUser();
  if (user) {
    document.getElementById('userName').textContent = user.name || 'Usuário autorizado';
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userBar').style.display = 'flex';
  }

  document.getElementById('btnLogout').addEventListener('click', async () => {
    const button = document.getElementById('btnLogout');
    button.disabled = true;
    await authManager.logout();
    window.location.href = '/login.html';
  });

  if (window.lucide) window.lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
  void initializePortal();
});
