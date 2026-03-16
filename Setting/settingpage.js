const changePasswordForm = document.getElementById('changePasswordForm');
const passwordMessage = document.getElementById('passwordMessage');
const infoName = document.getElementById('infoName');
const infoEmail = document.getElementById('infoEmail');

function setPasswordMessage(text, kind) {
    if (!passwordMessage) return;
    passwordMessage.textContent = text || '';
    passwordMessage.classList.toggle('is-success', kind === 'success');
}

// Populate account info card
function loadAccountInfo() {
    if (!window.Auth) return;
    const user = window.Auth.getCurrentUser?.();
    if (!user) return;
    if (infoName)  infoName.textContent  = user.displayName || 'Người dùng';
    if (infoEmail) infoEmail.textContent = user.email       || '—';
}

// Require login
if (window.Auth) {
    window.Auth.requireLogin({ redirectTo: '../login&register/Login/login_site.html' });
}

document.addEventListener('DOMContentLoaded', () => {
    loadAccountInfo();
});

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setPasswordMessage('');

        if (!window.Auth) {
            return setPasswordMessage('Thiếu auth.js. Hãy kiểm tra đường dẫn script.', 'error');
        }

        const fd = new FormData(changePasswordForm);
        const oldPassword        = String(fd.get('oldPassword')        || '');
        const newPassword        = String(fd.get('newPassword')        || '');
        const confirmNewPassword = String(fd.get('confirmNewPassword') || '');

        if (newPassword !== confirmNewPassword) {
            return setPasswordMessage('Mật khẩu mới xác nhận không khớp.', 'error');
        }

        const result = await window.Auth.changePassword({ oldPassword, newPassword });
        if (!result.ok) {
            return setPasswordMessage(result.message || 'Đổi mật khẩu thất bại.', 'error');
        }

        changePasswordForm.reset();
        setPasswordMessage(result.message || 'Đổi mật khẩu thành công.', 'success');
    });
}