(function () {
  'use strict';

  // DOM Elements
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  const emailInput = document.getElementById('emailInput');
  const forgotPasswordMessage = document.getElementById('forgotPasswordMessage');

  // Hiển thị thông báo lỗi
  function showError(message) {
    forgotPasswordMessage.className = 'form-message error';
    forgotPasswordMessage.textContent = message;
    console.error('Error:', message);
  }

  // Kiểm tra xem Auth có sẵn không
  function checkAuth() {
    if (!window.Auth) {
      showError('Hệ thống chưa sẵn sàng. Vui lòng làm mới trang.');
      return false;
    }
    if (!window.Auth.findUserByEmail) {
      showError('Hàm tìm kiếm không khả dụng. Vui lòng làm mới trang.');
      return false;
    }
    return true;
  }

  // Xử lý form tìm kiếm email
  forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Kiểm tra Auth trước
    if (!checkAuth()) {
      return;
    }
    
    const email = emailInput.value.trim();
    console.log('Searching for email:', email);

    if (!email) {
      showError('Vui lòng nhập email');
      return;
    }

    try {
      // Sử dụng hàm findUserByEmail từ auth.js
      const user = window.Auth.findUserByEmail(email);
      console.log('User found:', user);

      if (user) {
        // Tìm thấy tài khoản - lưu thông tin và chuyển sang PasswordFound
        sessionStorage.setItem('forgotPasswordUser', JSON.stringify(user));
        console.log('Redirecting to PasswordFound.html');
        window.location.href = 'PasswordFound.html';
      } else {
        // Không tìm thấy tài khoản - chuyển sang Password0Found
        sessionStorage.setItem('attemptedEmail', email);
        console.log('Redirecting to Password0Found.html');
        window.location.href = 'Password0Found.html';
      }
    } catch (error) {
      console.error('Error during search:', error);
      showError('Đã xảy ra lỗi khi tìm kiếm. ' + error.message);
    }
  });

  // Khởi tạo - kiểm tra Auth và focus vào input email
  console.log('ForgotPassword.js loaded');
  console.log('window.Auth:', window.Auth);
  
  if (checkAuth()) {
    emailInput.focus();
  }
})();
