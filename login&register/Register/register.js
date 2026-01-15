const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

function setMessage(text, kind) {
  if (!registerMessage) return;
  registerMessage.textContent = text || '';
  registerMessage.classList.toggle('is-success', kind === 'success');
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!window.Auth) {
      return setMessage('Thiếu auth.js. Hãy kiểm tra đường dẫn script.', 'error');
    }

    const formData = new FormData(registerForm);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    setMessage('');

    if (password !== confirmPassword) {
      return setMessage('Mật khẩu xác nhận không khớp.', 'error');
    }

    const result = await window.Auth.register({ email, password });
    if (!result.ok) {
      return setMessage(result.message || 'Đăng ký thất bại.', 'error');
    }

    setMessage('Đăng ký thành công! Đang chuyển sang trang đăng nhập...', 'success');

    setTimeout(() => {
      window.location.href = '../Login/login_site.html?registered=1';
    }, 700);
  });
}
