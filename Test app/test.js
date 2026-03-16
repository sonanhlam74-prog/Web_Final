document.addEventListener('DOMContentLoaded', () => {
  // Require login for this page
  if (window.Auth) {
    window.Auth.requireLogin({ redirectTo: '../login&register/Login/login_site.html' });
  }
});
