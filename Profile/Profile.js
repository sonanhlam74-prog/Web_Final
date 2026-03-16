document.addEventListener('DOMContentLoaded', () => {
  // Require login for this page
  if (window.Auth) {
    window.Auth.requireLogin({ redirectTo: '../login&register/Login/login_site.html' });
  }

  const currentUser = window.Auth?.getCurrentUser?.() || null;

  // Compatibility keys (used by other pages)
  const COMPAT_AVATAR_KEY = 'avatarImage';
  const COMPAT_NAME_KEY = 'userName';
  const LEGACY_GALLERY_KEY = 'avatarGallery';

  // Per-account keys
  const USER_AVATAR_KEY = currentUser ? `avatarImage:${currentUser.id}` : COMPAT_AVATAR_KEY;
  const USER_GALLERY_KEY = currentUser ? `avatarGallery:${currentUser.id}` : LEGACY_GALLERY_KEY;
  const USER_NAME_KEY = currentUser ? `userName:${currentUser.id}` : COMPAT_NAME_KEY;

  const DEFAULT_AVATAR = window.Auth?.getDefaultAvatar?.() ||
    'https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_uY-eteostdWLqKYG2-4kktArf-mOI1uoK0gxkh_VGxk2iFSwnli1Clzdmv6JpBUT1v1l1z_PW2CwOLSodMU4GTC4nwyzRGFosU0XMVNw1iY79vAQCD6aeg8KpafIqK7bKH9Xl8KQNd56PQms0kLA=w919-h516-p-k-no-nu';

  // DOM Elements
  const $ = (id) => document.getElementById(id);
  const currentAvatar = $('currentAvatar');
  const importBtn = $('importBtn');
  const importInput = $('importInput');
  const gallery = $('gallery');
  const imageCount = $('imageCount');
  const emptyGallery = $('emptyGallery');

  // State
  let galleryImages = [];
  let currentAvatarSrc = '';

  // Load data from localStorage
  const loadData = () => {
    // Load current avatar (prefer Auth user.avatar)
    currentAvatarSrc =
      currentUser?.avatar ||
      localStorage.getItem(USER_AVATAR_KEY) ||
      localStorage.getItem(COMPAT_AVATAR_KEY) ||
      DEFAULT_AVATAR;
    currentAvatar.src = currentAvatarSrc;

    // Load gallery
    try {
      const saved = localStorage.getItem(USER_GALLERY_KEY);
      galleryImages = saved ? JSON.parse(saved) : [];
    } catch {
      galleryImages = [];
    }

    // Migrate legacy shared gallery into per-user (only if per-user gallery is empty)
    if (currentUser && galleryImages.length === 0) {
      try {
        const legacy = localStorage.getItem(LEGACY_GALLERY_KEY);
        const parsed = legacy ? JSON.parse(legacy) : [];
        if (Array.isArray(parsed) && parsed.length > 0) {
          galleryImages = parsed;
          localStorage.setItem(USER_GALLERY_KEY, JSON.stringify(galleryImages));
        }
      } catch {
        // ignore
      }
    }

    renderGallery();
  };

  // Save gallery to localStorage
  const saveGallery = () => {
    try {
      localStorage.setItem(USER_GALLERY_KEY, JSON.stringify(galleryImages));
    } catch {
      showToast('Không thể lưu thư viện ảnh (có thể do dung lượng localStorage).', 'error');
    }
  };

  // Set current avatar
  const setCurrentAvatar = (src) => {
    currentAvatarSrc = src;
    currentAvatar.src = src;
    try {
      localStorage.setItem(USER_AVATAR_KEY, src);
      localStorage.setItem(COMPAT_AVATAR_KEY, src);
    } catch {
      showToast('Không thể lưu avatar.', 'error');
    }

    // Sync header and sidebar avatars
    const hdrImg = document.getElementById('headerAvatarImg');
    if (hdrImg) hdrImg.src = src;
    const sbImg = document.getElementById('sidebarAvatar');
    if (sbImg) sbImg.src = src;

    // Persist to account (Auth)
    try {
      window.Auth?.setCurrentUserAvatar?.(src);
    } catch {
      // ignore
    }

    renderGallery(); // Re-render to update selected state
  };

  // Render gallery
  const renderGallery = () => {
    gallery.innerHTML = '';
    imageCount.textContent = `(${galleryImages.length})`;
    emptyGallery.style.display = galleryImages.length === 0 ? 'block' : 'none';

    galleryImages.forEach((src, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item' + (src === currentAvatarSrc ? ' selected' : '');

      item.innerHTML = `
        <img src="${src}" alt="Ảnh ${index + 1}">
        <button class="delete-btn" data-index="${index}" title="Xóa ảnh">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        ${src === currentAvatarSrc ? '<span class="select-badge">Đang dùng</span>' : ''}
      `;

      // Click to select as avatar
      item.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) return;
        setCurrentAvatar(src);
      });

      // Delete button
      item.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Bạn có chắc muốn xóa ảnh này?')) {
          deleteImage(index);
        }
      });

      gallery.appendChild(item);
    });
  };

  // Delete image from gallery
  const deleteImage = (index) => {
    const deletedSrc = galleryImages[index];
    galleryImages.splice(index, 1);
    saveGallery();

    // If deleted image was current avatar, reset to default
    if (deletedSrc === currentAvatarSrc) {
      setCurrentAvatar(galleryImages[0] || DEFAULT_AVATAR);
    } else {
      renderGallery();
    }
  };

  // Import image
  const importImage = (file) => {
    if (!file.type?.startsWith('image/')) {
      showToast('Vui lòng chọn file ảnh (jpg/png/webp...).', 'error');
      return;
    }

    if (file.size > 1_500_000) {
      showToast('Ảnh quá lớn. Hãy chọn ảnh nhỏ hơn ~1.5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;

      // Check if already exists
      if (galleryImages.includes(dataUrl)) {
        showToast('Ảnh này đã có trong thư viện!', 'error');
        return;
      }

      // Add to gallery
      galleryImages.unshift(dataUrl);
      saveGallery();

      // Set as current avatar
      setCurrentAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Event listeners
  importBtn.addEventListener('click', () => importInput.click());

  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0];
    if (file) {
      importImage(file);
      importInput.value = '';
    }
  });

  // === Rename Feature ===
  const nameInput = $('nameInput');
  const renameBtn = $('renameBtn');
  const NAME_STORAGE_KEY = 'userName';

  const loadName = () => {
    nameInput.value =
      currentUser?.displayName ||
      localStorage.getItem(USER_NAME_KEY) ||
      localStorage.getItem(COMPAT_NAME_KEY) ||
      '';
  };

  const saveName = (name) => {
    try {
      localStorage.setItem(USER_NAME_KEY, name);
      localStorage.setItem(COMPAT_NAME_KEY, name);
      window.Auth?.updateCurrentUserProfile?.({ displayName: name });
      showToast('Đổi tên thành công!', 'success');
      updateHero();
    } catch {
      showToast('Không thể lưu tên người dùng.', 'error');
    }
  };

  renameBtn?.addEventListener('click', () => {
    const newName = nameInput.value.trim();
    if (!newName) { showToast('Tên không được để trống.', 'error'); return; }
    saveName(newName);
  });

  // === Sex ===
  const sexSelect = $('sexSelect');
  const sexBtn = $('sexBtn');
  const SEX_STORAGE_KEY = currentUser ? `userSex:${currentUser.id}` : 'userSex';

  const loadSex = () => {
    sexSelect.value = localStorage.getItem(SEX_STORAGE_KEY) || '';
  };

  const saveSex = () => {
    const val = sexSelect.value;
    if (!val) { showToast('Vui lòng chọn giới tính.', 'error'); return; }
    try {
      localStorage.setItem(SEX_STORAGE_KEY, val);
      showToast('Đã lưu giới tính!', 'success');
      updateHero();
    } catch { showToast('Không thể lưu giới tính.', 'error'); }
  };

  sexBtn?.addEventListener('click', saveSex);

  // === Email ===
  const emailInput = $('emailInput');
  const emailBtn = $('emailBtn');
  const EMAIL_KEY = currentUser ? `userEmail:${currentUser.id}` : 'userEmail';

  const loadEmail = () => {
    emailInput.value = localStorage.getItem(EMAIL_KEY) || currentUser?.email || '';
  };

  emailBtn?.addEventListener('click', () => {
    const val = emailInput.value.trim();
    if (!val) { showToast('Email không được để trống.', 'error'); return; }
    try {
      localStorage.setItem(EMAIL_KEY, val);
      showToast('Đã lưu email!', 'success');
      updateHero();
    } catch { showToast('Không thể lưu email.', 'error'); }
  });

  // === Phone ===
  const phoneInput = $('phoneInput');
  const phoneBtn = $('phoneBtn');
  const PHONE_KEY = currentUser ? `userPhone:${currentUser.id}` : 'userPhone';

  const loadPhone = () => {
    phoneInput.value = localStorage.getItem(PHONE_KEY) || '';
  };

  phoneBtn?.addEventListener('click', () => {
    const val = phoneInput.value.trim();
    try {
      localStorage.setItem(PHONE_KEY, val);
      showToast('Đã lưu số điện thoại!', 'success');
      updateHero();
    } catch { showToast('Không thể lưu số điện thoại.', 'error'); }
  });

  // === Birthday ===
  const birthdayInput = $('birthdayInput');
  const birthdayBtn = $('birthdayBtn');
  const BIRTHDAY_KEY = currentUser ? `userBirthday:${currentUser.id}` : 'userBirthday';

  const loadBirthday = () => {
    birthdayInput.value = localStorage.getItem(BIRTHDAY_KEY) || '';
  };

  birthdayBtn?.addEventListener('click', () => {
    const val = birthdayInput.value;
    try {
      localStorage.setItem(BIRTHDAY_KEY, val);
      showToast('Đã lưu ngày sinh!', 'success');
      updateHero();
    } catch { showToast('Không thể lưu ngày sinh.', 'error'); }
  });

  // === Address ===
  const addressInput = $('addressInput');
  const addressBtn = $('addressBtn');
  const ADDRESS_KEY = currentUser ? `userAddress:${currentUser.id}` : 'userAddress';

  const loadAddress = () => {
    addressInput.value = localStorage.getItem(ADDRESS_KEY) || '';
  };

  addressBtn?.addEventListener('click', () => {
    const val = addressInput.value.trim();
    try {
      localStorage.setItem(ADDRESS_KEY, val);
      showToast('Đã lưu địa chỉ!', 'success');
      updateHero();
    } catch { showToast('Không thể lưu địa chỉ.', 'error'); }
  });

  // === Hero update ===
  const SEX_LABELS = { male: 'Nam', female: 'Nữ', other: 'Khác' };

  const updateHero = () => {
    const name = localStorage.getItem(USER_NAME_KEY) ||
                 currentUser?.displayName || 'Người dùng';
    const email = localStorage.getItem(EMAIL_KEY) || currentUser?.email || '';
    const phone = localStorage.getItem(PHONE_KEY) || '';
    const sex   = localStorage.getItem(SEX_STORAGE_KEY) || '';
    const bday  = localStorage.getItem(BIRTHDAY_KEY) || '';

    const heroName = $('heroName');
    const heroEmailText = $('heroEmailText');
    const heroPhoneText = $('heroPhoneText');
    const heroBadgeSex  = $('heroBadgeSex');
    const heroBadgeBirthday = $('heroBadgeBirthday');

    if (heroName) heroName.textContent = name;
    if (heroEmailText) heroEmailText.textContent = email || 'Chưa có email';
    if (heroPhoneText) heroPhoneText.textContent = phone || '—';
    if (heroBadgeSex)  heroBadgeSex.innerHTML  = `<i class='bx bx-user'></i> ${SEX_LABELS[sex] || '—'}`;
    if (heroBadgeBirthday) heroBadgeBirthday.innerHTML = `<i class='bx bx-calendar'></i> ${bday || '—'}`;
  };

  // === Toast ===
  let toastTimer = null;
  const showToast = (msg, type = 'success') => {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `toast toast-${type} toast-show`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.classList.remove('toast-show'); }, 3000);
  };

  // === Initialize ===
  loadData();
  loadName();
  loadSex();
  loadEmail();
  loadPhone();
  loadBirthday();
  loadAddress();
  updateHero();
});