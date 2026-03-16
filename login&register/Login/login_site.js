const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('passwordInput');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

function setMessage(text, kind) {
  if (!loginMessage) return;
  loginMessage.textContent = text || '';
  loginMessage.classList.toggle('is-success', kind === 'success');
}

// Forgot password link handler
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Forgot password link clicked');
    window.location.href = '../ForgotPassword/ForgotPassword.html';
  });
}

// Toggle password visibility
if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', (e) => {
    e.preventDefault();
    
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    // Toggle icon visibility
    const eyeIcon = togglePassword.querySelector('.eye-icon');
    const eyeSlashIcon = togglePassword.querySelector('.eye-slash-icon');
    
    if (eyeIcon) {
      eyeIcon.classList.toggle('hidden', !isPassword);
    }
    if (eyeSlashIcon) {
      eyeSlashIcon.classList.toggle('hidden', isPassword);
    }
  });
}

// If user just registered, show a hint
try {
  const params = new URLSearchParams(window.location.search);
  if (params.get('registered') === '1') {
    setMessage('Đăng ký thành công. Bạn có thể đăng nhập ngay.', 'success');
  }
} catch {
  // ignore
}

// If already logged in, go straight to the app
if (window.Auth?.getCurrentUser?.()) {
  window.location.href = '../../Test app/test.html';
}

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!window.Auth) {
      return setMessage('Thiếu auth.js. Hãy kiểm tra đường dẫn script.', 'error');
    }

    const formData = new FormData(loginForm);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    setMessage('');

    const result = await window.Auth.login({ email, password });
    if (!result.ok) {
      return setMessage(result.message || 'Đăng nhập thất bại.', 'error');
    }

    // Keep compatibility with existing UI
    try {
      localStorage.setItem('userName', result.user.displayName || 'Người dùng');
    } catch {
      // ignore
    }

    window.location.href = '../../Test app/test.html';
  });
}

// Basic UX for "forgot password" placeholder
document.querySelectorAll('.page-link-label').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
  });
});

