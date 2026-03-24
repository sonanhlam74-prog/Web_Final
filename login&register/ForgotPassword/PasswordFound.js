(function () {
  'use strict';

  // DOM Elements
  const resetPasswordForm = document.getElementById('resetPasswordForm');
  const newPasswordInput = document.getElementById('newPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const passwordMessage = document.getElementById('passwordMessage');
  const resetPasswordBtn = document.getElementById('resetPasswordBtn');
  const backBtn = document.getElementById('backBtn');
  const loginBtn = document.getElementById('loginBtn');
  const accountEmail = document.getElementById('accountEmail');
  const accountName = document.getElementById('accountName');
  const successPage = document.getElementById('successPage');
  const formContainer = document.querySelector('.form-container:not(.hidden)');
  const toggleNewPassword = document.getElementById('toggleNewPassword');
  const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

  let currentUser = null;

  // Hiển thị thông báo lỗi
  function showError(message) {
    passwordMessage.className = 'form-message error';
    passwordMessage.textContent = message;
  }

  // Hiển thị trang thành công
  function showSuccess() {
    formContainer.classList.add('hidden');
    successPage.classList.remove('hidden');
  }

  // Toggle password visibility function
  function setupTogglePassword(button, input) {
    if (button && input) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        
        // Toggle icon visibility
        const eyeIcon = button.querySelector('.eye-icon');
        const eyeSlashIcon = button.querySelector('.eye-slash-icon');
        
        if (eyeIcon) {
          eyeIcon.classList.toggle('hidden', !isPassword);
        }
        if (eyeSlashIcon) {
          eyeSlashIcon.classList.toggle('hidden', isPassword);
        }
      });
    }
  }

  // Khởi tạo trang - lấy thông tin user từ sessionStorage
  function initPage() {
    const userJson = sessionStorage.getItem('forgotPasswordUser');
    
    if (!userJson) {
      // Không tìm thấy thông tin user - quay lại trang trước
      window.location.href = 'ForgotPassword.html';
      return;
    }

    try {
      currentUser = JSON.parse(userJson);
      
      // Hiển thị thông tin tài khoản
      accountEmail.textContent = `Email: ${currentUser.email}`;
      accountName.textContent = `Tên tài khoản: ${currentUser.displayName}`;
      
      // Setup toggle password
      setupTogglePassword(toggleNewPassword, newPasswordInput);
      setupTogglePassword(toggleConfirmPassword, confirmPasswordInput);
      
      // Focus vào input password
      newPasswordInput.focus();
    } catch (error) {
      window.location.href = 'ForgotPassword.html';
    }
  }

  // Xử lý form đặt lại mật khẩu
  resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Kiểm tra mật khẩu có trùng khớp
    if (newPassword !== confirmPassword) {
      showError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    // Kiểm tra độ phức tạp mật khẩu
    const pwCheck = window.Auth.validatePasswordComplexity(newPassword, 'Mật khẩu');
    if (!pwCheck.ok) {
      showError(pwCheck.message);
      return;
    }

    // Cập nhật mật khẩu
    const result = await updatePassword(currentUser.id, newPassword);
    
    if (result.ok) {
      // Xóa thông tin từ sessionStorage
      sessionStorage.removeItem('forgotPasswordUser');
      showSuccess();
    } else {
      showError(result.message);
    }
  });

  // Cập nhật mật khẩu trong storage
  async function updatePassword(userId, newPassword) {
    try {
      const users = window.Auth.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return { ok: false, message: 'Không tìm thấy tài khoản' };
      }

      const passwordHash = await window.Auth.sha256Hex(newPassword);
      users[userIndex].passwordHash = passwordHash;
      users[userIndex].updatedAt = new Date().toISOString();

      window.Auth.setUsers(users);
      window.Auth.clearLock(users[userIndex].email);

      return { ok: true };
    } catch (error) {
      return { ok: false, message: 'Lỗi khi cập nhật mật khẩu' };
    }
  }

  // Sự kiện quay lại
  backBtn.addEventListener('click', () => {
    sessionStorage.removeItem('forgotPasswordUser');
    window.location.href = 'ForgotPassword.html';
  });

  // Sự kiện đăng nhập
  loginBtn.addEventListener('click', () => {
    window.location.href = '../Login/login.html';
  });

  // Khởi tạo trang
  initPage();
})();
