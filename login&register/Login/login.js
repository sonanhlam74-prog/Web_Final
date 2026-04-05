$(document).ready(function () {

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    if (currentUser.role === 'admin')
      window.location.href = '../../Tasks/admin.html';
    else
      window.location.href = '../../Test app/main.html';
  }

  $('#loginForm').on('submit', function (e) {
    e.preventDefault();

    const username = $('#username').val().trim();
    const password = $('#password').val().trim();

    // ADMIN
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('currentUser', JSON.stringify({
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        name: 'Quản trị viên',
        avatar: 'https://ui-avatars.com/api/?name=Admin',
        accumulatedSpend: 1500000
      }));
      window.location.href = '../../Tasks/admin.html';
    }

    // USER
    else if (username === 'user' && password === 'user123') {
      localStorage.setItem('currentUser', JSON.stringify({
        username: 'user',
        password: 'user123',
        role: 'user',
        name: 'Người dùng',
        avatar: 'https://ui-avatars.com/api/?name=User',
        accumulatedSpend: 150000
      }));
      window.location.href = '../../Test app/main.html';
    }

    else {
      $('#loginError').removeClass('d-none');
    }
  });

});