document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.btn-primary');
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = '/register/register.html';
    });
  }
});