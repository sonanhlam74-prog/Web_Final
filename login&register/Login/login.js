$(document).ready(function () {

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (currentUser) {
    if (currentUser.role === 'admin')
      window.location.href = '../../Tasks/admin.html';
    else
      window.location.href = '../../Test app/main.html';
  }

  // Retrieve remembered user
  const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser'));
  if (rememberedUser) {
    $('#username').val(rememberedUser.username);
    $('#password').val(rememberedUser.password);
    $('#rememberMe').prop('checked', true);
  }

  // Toggle password visibility
  $('#togglePasswordBtn').on('change', function () {
    const passwordInput = $('#password');
    if ($(this).is(':checked')) {
      passwordInput.attr('type', 'text');
    } else {
      passwordInput.attr('type', 'password');
    }
  });

  $('#loginForm').on('submit', async function (e) {
    e.preventDefault();

    const username = $('#username').val().trim();
    const password = $('#password').val().trim();

    // Save or remove remembered user
    const rememberMe = $('#rememberMe').is(':checked');
    if (rememberMe) {
      localStorage.setItem('rememberedUser', JSON.stringify({ username, password }));
    } else {
      localStorage.removeItem('rememberedUser');
    }

    if (window.Auth) {
      // First attempt to login
      let res = await window.Auth.login({ email: username, password: password });

      // If missing account but we used mock credentials, auto-register them seamlessly
      if (!res.ok && res.code === "invalid_credentials") {
        if (username === 'admin' && password === 'admin123') {
           await window.Auth.register({ email: username, password: password });
           let userRes = await window.Auth.login({ email: username, password: password });
           if (userRes.ok) { window.Auth.updateCurrentUserProfile({ displayName: 'Quản trị viên', avatar: 'https://ui-avatars.com/api/?name=Admin' }); }
           res = userRes;
        } else if (username === 'user' && password === 'user123') {
           await window.Auth.register({ email: username, password: password });
           let userRes = await window.Auth.login({ email: username, password: password });
           if (userRes.ok) { window.Auth.updateCurrentUserProfile({ displayName: 'Người dùng', avatar: 'https://ui-avatars.com/api/?name=User' }); }
           res = userRes;
        }
      }

      if (res.ok) {
        const u = window.Auth.getCurrentUser();
        if (u && u.role === 'admin') {
          window.location.href = '../../Tasks/admin.html';
        } else {
          window.location.href = '../../Test app/main.html';
        }
      } else {
        $('#loginError').text(res.message || "Đăng nhập thất bại").removeClass('d-none');
      }
    } else {
      $('#loginError').text("Hệ thống đăng nhập đang bảo trì.").removeClass('d-none');
    }
  });

});