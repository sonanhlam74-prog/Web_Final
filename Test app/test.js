document.addEventListener('DOMContentLoaded', () => {
  // Require login for this page
  if (window.Auth) {
    window.Auth.requireLogin({ redirectTo: '../login&register/Login/login_site.html' });
  }

  // Constants
  const AVATAR_STORAGE_KEY = 'avatarImage';
  const NAME_STORAGE_KEY = 'userName';
  
  // DOM Elements
  const $ = (id) => document.getElementById(id);
  const avatarImg = document.querySelector('#avatarBtn .avatar-icon');
  const avatarEditBtn = $('avatarEditBtn');
  const avatarFileInput = $('avatarFileInput');
  const avatarBtn = $('avatarBtn');
  const menu = $('menu');
  const userInfo = $('userInfo');
  const menuItems = $('menuItems');
  const closeBtn = $('closeBtn');
  const overlay = $('overlay');
  const profileBtn = $('profileBtn');
  const logoutBtn = $('logoutBtn');
  const userNameEl = $('userName');
  const userEmailEl = document.querySelector('.user-email');
  const messageBtn = $('messageBtn');
  const settingBtn = $('settingBtn');

  let isMenuOpen = false;

  // Utility functions
  const setAvatar = (src) => {
    if (avatarImg && src?.trim()) avatarImg.src = src;
  };

  const toggleClasses = (el, add, remove) => {
    if (!el) return;
    el.classList.remove(...remove);
    el.classList.add(...add);
  };

  const navigate = (url) => (window.location.href = encodeURI(url));

  // Avatar: load from localStorage
  const savedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
  if (savedAvatar) setAvatar(savedAvatar);

  // UserName: load from localStorage
  const savedName = localStorage.getItem(NAME_STORAGE_KEY);
  if (savedName && userNameEl) userNameEl.textContent = savedName;

  // Email: load from auth session
  if (window.Auth) {
    const currentUser = window.Auth.getCurrentUser();
    if (currentUser) {
      if (userNameEl && !savedName) userNameEl.textContent = currentUser.displayName || 'Người dùng';
      if (userEmailEl) userEmailEl.textContent = currentUser.email || 'user@example.com';
    }
  }

  // Avatar upload
  if (avatarEditBtn && avatarFileInput) {
    avatarEditBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      avatarFileInput.click();
    });

    avatarFileInput.addEventListener('change', () => {
      const file = avatarFileInput.files?.[0];
      if (!file) return;

      if (!file.type?.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh (jpg/png/webp...).');
        return (avatarFileInput.value = '');
      }

      if (file.size > 1_500_000) {
        alert('Ảnh quá lớn. Hãy chọn ảnh nhỏ hơn ~1.5MB.');
        return (avatarFileInput.value = '');
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl !== 'string') return;
        try {
          localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl);
          setAvatar(dataUrl);
        } catch {
          alert('Không thể lưu ảnh (có thể do dung lượng localStorage).');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Menu toggle
  const toggleMenu = () => {
    isMenuOpen = !isMenuOpen;

    if (isMenuOpen) {
      toggleClasses(menu, ['opacity-100', 'scale-100'], ['opacity-0', 'scale-95', 'pointer-events-none']);
      toggleClasses(userInfo, ['opacity-100', 'translate-x-0'], ['opacity-0', '-translate-x-4']);
      menuItems?.classList.add('menu-open');
      overlay?.classList.remove('hidden');
    } else {
      toggleClasses(menu, ['opacity-0', 'scale-95', 'pointer-events-none'], ['opacity-100', 'scale-100']);
      toggleClasses(userInfo, ['opacity-0', '-translate-x-4'], ['opacity-100', 'translate-x-0']);
      menuItems?.classList.remove('menu-open');
      overlay?.classList.add('hidden');
    }
  };

  // Menu event listeners
  if (avatarBtn && menu && userInfo && menuItems) {
    avatarBtn.addEventListener('click', toggleMenu);
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isMenuOpen) toggleMenu();
    });
    overlay?.addEventListener('click', () => isMenuOpen && toggleMenu());

    // Menu item clicks close menu
    menuItems.querySelectorAll('button:not(#logoutBtn)').forEach((btn) => {
      btn.addEventListener('click', () => isMenuOpen && toggleMenu());
    });
  }

  // Navigation
  profileBtn?.addEventListener('click', () => navigate('../Profile/Profile.html'));
  settingBtn?.addEventListener('click', () => navigate('../Setting/settingpage.html'));
  logoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    window.Auth?.logout?.();
    navigate('../login&register/Login/login_site.html');
  });

  messageBtn?.addEventListener('click', () => navigate('../Messge/Messge.html'));
  
  // Page switching
  const pages = ['page 1', 'page 2', 'page 3'].map($);
  const btns = ['btnPage1', 'btnPage2', 'btnPage3'].map($);

  if (pages.every(Boolean) && btns.every(Boolean)) {
    btns.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        pages.forEach((page, j) => (page.style.display = i === j ? 'block' : 'none'));
      });
    });
  }
});
