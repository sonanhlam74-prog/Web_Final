const searchInput = document.getElementById("Mysearch");
const sideNav = document.getElementById("sideNav");
const sideNavEmpty = document.getElementById("sideNavEmpty");
const navToggle = document.getElementById("navToggle");
const changePasswordForm = document.getElementById('changePasswordForm');
const passwordMessage = document.getElementById('passwordMessage');
const passwordsLink = document.getElementById('passwordsLink');

function setPasswordMessage(text, kind) {
    if (!passwordMessage) return;
    passwordMessage.textContent = text || '';
    passwordMessage.classList.toggle('is-success', kind === 'success');
}

function setNavOpen(isOpen) {
    if (!sideNav || !navToggle) return;

    sideNav.classList.toggle("side-nav--open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
}

function filterSideNavLinks(query) {
    if (!sideNav) return;

    const links = sideNav.querySelectorAll("a");
    const normalized = (query || "").trim().toLowerCase();
    let visibleCount = 0;

    links.forEach((link) => {
        const text = (link.textContent || "").toLowerCase();
        const isVisible = normalized.length === 0 || text.includes(normalized);
        link.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
    });

    if (sideNavEmpty) {
        sideNavEmpty.hidden = visibleCount !== 0;
    }
}

if (navToggle) {
    navToggle.addEventListener("click", () => {
        const isOpen = !!sideNav?.classList.contains("side-nav--open");
        setNavOpen(!isOpen);
    });
}

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        filterSideNavLinks(e.target.value);
    });
}

// Require login for settings page
if (window.Auth) {
    window.Auth.requireLogin({ redirectTo: '../login&register/Login/login_site.html' });
}

// Focus the password panel when clicking "Passwords"
passwordsLink?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('content')?.focus?.();
});

if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setPasswordMessage('');

        if (!window.Auth) {
            return setPasswordMessage('Thiếu auth.js. Hãy kiểm tra đường dẫn script.', 'error');
        }

        const fd = new FormData(changePasswordForm);
        const oldPassword = String(fd.get('oldPassword') || '');
        const newPassword = String(fd.get('newPassword') || '');
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

// Initial state
filterSideNavLinks(searchInput?.value || "");