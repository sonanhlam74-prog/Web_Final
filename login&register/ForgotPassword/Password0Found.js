(function () {
  'use strict';

  const tryAnotherBtn = document.getElementById('tryAnotherBtn');
  const registerBtn = document.getElementById('registerBtn');

  // Sự kiện thử email khác
  tryAnotherBtn.addEventListener('click', () => {
    sessionStorage.removeItem('attemptedEmail');
    window.location.href = 'ForgotPassword.html';
  });

  // Sự kiện đăng ký tài khoản
  registerBtn.addEventListener('click', () => {
    sessionStorage.removeItem('attemptedEmail');
    window.location.href = '../Register/register.html';
  });
})();
