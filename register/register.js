document.addEventListener('DOMContentLoaded', () => {
  const registerLink = document.querySelector('.register-link');
  const loginLink = document.querySelector('.login-link');
  const underline = document.querySelector('.main-underline');
  const confirmWrapper = document.querySelector('#password_confirm')?.closest('.input-wrapper');
  const submitBtn = document.querySelector('.submit-button');
  const form = document.querySelector('.auth-form');
  const closeBtn = document.querySelector('.close-button');
  const message = document.querySelector('.message');

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    window.location.href = '/register/logout.html';
    return;
  }

  if (!localStorage.getItem('db')) {
    localStorage.setItem('db', JSON.stringify({ users: [] }));
  }

  function moveUnderlineTo(linkEl) {
    const cardRect = document.querySelector('.auth-card').getBoundingClientRect();
    const linkRect = linkEl.getBoundingClientRect();
    underline.style.left = `${linkRect.left - cardRect.left}px`;
    underline.style.width = `${linkRect.width}px`;
  }

  function activateLink(linkEl) {
    registerLink.classList.remove('active');
    loginLink.classList.remove('active');
    linkEl.classList.add('active');
    moveUnderlineTo(linkEl);

    if (linkEl === registerLink) {
      confirmWrapper.classList.remove('hidden');
      submitBtn.textContent = 'Зарегистрироваться';
    } else {
      confirmWrapper.classList.add('hidden');
      submitBtn.textContent = 'Войти';
    }

    message.textContent = '';
  }

  activateLink(registerLink);

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
    const confirm = document.querySelector('#password_confirm')?.value.trim();

    const isLogin = loginLink.classList.contains('active');

    message.textContent = '';
    message.style.color = 'red';

    if (isLogin) {
      const user = db.users.find(u => u.email === email && u.password === password);
      if (!user) {
        message.textContent = 'Неверная почта или пароль';
        return;
      }

      localStorage.setItem('currentUser', JSON.stringify(user));
      message.style.color = 'green';
      message.textContent = 'Вход выполнен!';
      setTimeout(() => (window.location.href = '/register/logout.html'), 1000);
      return;
    }

    if (!email || !password || !confirm) {
      message.textContent = 'Заполните все поля!';
      return;
    }

    if (password !== confirm) {
      message.textContent = 'Пароли не совпадают!';
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
    setTimeout(() => (window.location.href = '/register/logout.html'), 1000);
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
    if (active) moveUnderlineTo(active);
  });
});
