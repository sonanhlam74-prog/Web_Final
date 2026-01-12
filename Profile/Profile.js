document.addEventListener('DOMContentLoaded', () => {
  // Constants - same keys as test.js
  const AVATAR_STORAGE_KEY = 'avatarImage';
  const GALLERY_STORAGE_KEY = 'avatarGallery';
  const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_uY-eteostdWLqKYG2-4kktArf-mOI1uoK0gxkh_VGxk2iFSwnli1Clzdmv6JpBUT1v1l1z_PW2CwOLSodMU4GTC4nwyzRGFosU0XMVNw1iY79vAQCD6aeg8KpafIqK7bKH9Xl8KQNd56PQms0kLA=w919-h516-p-k-no-nu';

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
    // Load current avatar
    currentAvatarSrc = localStorage.getItem(AVATAR_STORAGE_KEY) || DEFAULT_AVATAR;
    currentAvatar.src = currentAvatarSrc;

    // Load gallery
    try {
      const saved = localStorage.getItem(GALLERY_STORAGE_KEY);
      galleryImages = saved ? JSON.parse(saved) : [];
    } catch {
      galleryImages = [];
    }

    renderGallery();
  };

  // Save gallery to localStorage
  const saveGallery = () => {
    try {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(galleryImages));
    } catch {
      alert('Không thể lưu thư viện ảnh (có thể do dung lượng localStorage).');
    }
  };

  // Set current avatar
  const setCurrentAvatar = (src) => {
    currentAvatarSrc = src;
    currentAvatar.src = src;
    try {
      localStorage.setItem(AVATAR_STORAGE_KEY, src);
    } catch {
      alert('Không thể lưu avatar.');
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
      alert('Vui lòng chọn file ảnh (jpg/png/webp...).');
      return;
    }

    if (file.size > 1_500_000) {
      alert('Ảnh quá lớn. Hãy chọn ảnh nhỏ hơn ~1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') return;

      // Check if already exists
      if (galleryImages.includes(dataUrl)) {
        alert('Ảnh này đã có trong thư viện!');
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
    nameInput.value = localStorage.getItem(NAME_STORAGE_KEY) || '';
  };

  const saveName = (name) => {
    try {
      localStorage.setItem(NAME_STORAGE_KEY, name);
      alert('Đổi tên thành công!');
    } catch {
      alert('Không thể lưu tên người dùng.');
    }
  };

  renameBtn?.addEventListener('click', () => {
    const newName = nameInput.value.trim();
    newName ? saveName(newName) : alert('Tên không được để trống.');
  });

  // Initialize
  loadData();
  loadName();
});