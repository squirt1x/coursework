document.addEventListener('DOMContentLoaded', () => {
  const registerLink = document.querySelector('.register-link');
  const loginLink = document.querySelector('.login-link');
  const underline = document.querySelector('.main-underline');
  const submitBtn = document.querySelector('.submit-button');
  const form = document.querySelector('.auth-form');
  const closeBtn = document.querySelector('.close-button');
  const message = document.querySelector('.message');

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    window.location.href = '/workspace/workspace.html';
    return;
  }

  if (!localStorage.getItem('db')) {
    localStorage.setItem('db', JSON.stringify({ users: [] }));
  }

  function moveUnderlineTo(linkEl) {
    if (!linkEl || !underline) return;

    const card = document.querySelector('.auth-card');
    const header = document.querySelector('.auth-header');
    if (!card || !header) return;

    const cardRect = card.getBoundingClientRect();
    const linkRect = linkEl.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();

    const left = Math.round(linkRect.left - cardRect.left);
    const width = Math.round(linkRect.width);

    const titleEl = header.querySelector('.auth-title');
    const titleHeight = titleEl ? titleEl.getBoundingClientRect().height : headerRect.height;
    const top = Math.round(headerRect.top - cardRect.top + titleHeight + 6);

    underline.style.left = `${left}px`;
    underline.style.width = `${width}px`;
    underline.style.top = `${top}px`;
  }

  function activateLink(linkEl) {
    registerLink.classList.remove('active');
    loginLink.classList.remove('active');

    linkEl.classList.add('active');
    moveUnderlineTo(linkEl);

    submitBtn.textContent = linkEl === registerLink ? 'Зарегистрироваться' : 'Войти';
    message.textContent = '';
  }

  activateLink(registerLink);
  requestAnimationFrame(() => moveUnderlineTo(registerLink));

  registerLink.addEventListener('click', e => {
    e.preventDefault();
    activateLink(registerLink);
  });

  loginLink.addEventListener('click', e => {
    e.preventDefault();
    activateLink(loginLink);
  });

  closeBtn.addEventListener('click', () => {
    window.location.href = '/index.html';
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    const db = JSON.parse(localStorage.getItem('db'));
    const email = document.querySelector('#email').value.trim();
    const password = document.querySelector('#password').value.trim();
    const isLogin = loginLink.classList.contains('active');

    message.textContent = '';
    message.style.color = 'red';

    if (!email || !password) {
      message.textContent = 'Заполните все поля!';
      return;
    }

    if (isLogin) {
      const user = db.users.find(u => u.email === email && u.password === password);

      if (!user) {
        message.textContent = 'Неверная почта или пароль';
        return;
      }

      localStorage.setItem('currentUser', JSON.stringify(user));
      message.style.color = 'green';
      message.textContent = 'Вход выполнен!';

      setTimeout(() => (window.location.href = '/workspace/workspace.html'), 1000);
      return;
    }

    if (db.users.find(u => u.email === email)) {
      message.textContent = 'Пользователь с такой почтой уже существует';
      return;
    }

    const newUser = {
      id: db.users.length ? db.users[db.users.length - 1].id + 1 : 1,
      email,
      password
    };

    db.users.push(newUser);
    localStorage.setItem('db', JSON.stringify(db));
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    message.style.color = 'green';
    message.textContent = 'Регистрация успешна!';

    setTimeout(() => (window.location.href = '/workspace/workspace.html'), 1000);
  });

  document.querySelectorAll('.eye-button').forEach(button => {
    button.addEventListener('click', () => {
      const input = button.parentElement.querySelector('input');
      const isVisible = input.type === 'text';

      input.type = isVisible ? 'password' : 'text';
      button.classList.toggle('active', !isVisible);
    });
  });

  window.addEventListener('resize', () => {
    const active = document.querySelector('.auth-link.active');
    moveUnderlineTo(active);
  });
});
