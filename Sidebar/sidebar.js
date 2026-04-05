const sidebar  = document.querySelector('.side-bar');
const menuBtn  = document.querySelector('#btn');
const searchBtn = document.querySelector('.side-bar .bx-search');
const THEME_KEY = 'taskManager_theme';

// ── Sidebar open / close ─────────────────────────────────────────────
const setSidebarOpen = (isOpen) => {
  if (!sidebar) return;
  sidebar.classList.toggle('open', isOpen);
  document.body.classList.toggle('sidebar-open', isOpen);
  if (menuBtn) {
    if (isOpen) menuBtn.classList.replace('bx-menu', 'bx-menu-alt-right');
    else        menuBtn.classList.replace('bx-menu-alt-right', 'bx-menu');
  }
};

menuBtn?.addEventListener('click', () => setSidebarOpen(!sidebar?.classList.contains('open')));
searchBtn?.addEventListener('click', () => setSidebarOpen(true));

// ── Sidebar search → sync with tasks page search input ───────────────
const sidebarSearch = document.getElementById('sidebarSearch');
if (sidebarSearch) {
  sidebarSearch.addEventListener('focus', () => setSidebarOpen(true));
  sidebarSearch.addEventListener('input', () => {
    const mainSearch = document.getElementById('searchInput');
    if (mainSearch) {
      mainSearch.value = sidebarSearch.value;
      mainSearch.dispatchEvent(new Event('input'));
    }
  });
}

// ── Theme helpers ────────────────────────────────────────────────────
function syncSidebarThemeBtn() {
  const isDark  = document.body.classList.contains('dark-mode');
  const icon    = document.getElementById('sidebarThemeIcon');
  const label   = document.getElementById('sidebarThemeLabel');
  const tooltip = document.getElementById('sidebarThemeTooltip');
  if (icon)    icon.className      = isDark ? 'bx bx-moon' : 'bx bx-sun';
  if (label)   label.textContent   = isDark ? 'Dark Mode'  : 'Light Mode';
  if (tooltip) tooltip.textContent = isDark ? 'Dark Mode'  : 'Light Mode';
}

document.addEventListener('DOMContentLoaded', () => {

  // ── Mark active nav item ─────────────────────────────────────
  const page = location.pathname.replace(/\\/g, '/').split('/').pop() || 'main.html';
  document.querySelectorAll('.side-bar .nav-list a[href]').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === page) a.classList.add('active');
  });

  // ── Load user info from Auth ─────────────────────────────────
  const nameEl   = document.getElementById('sidebarUserName');
  const emailEl  = document.getElementById('sidebarUserEmail');
  const avatarEl = document.getElementById('sidebarAvatar');
  if (window.Auth) {
    const user = window.Auth.getCurrentUser?.();
    if (user) {
      if (nameEl)  nameEl.textContent  = user.displayName || user.name || 'Người dùng';
      if (emailEl) emailEl.textContent = user.email || 'user@example.com';

      if (avatarEl) {
        // Priority: per-user key (set by Profile.js) → compat key → Auth user.avatar
        // Only accept data: URLs or http(s) URLs; skip relative paths (e.g. ../../Photo/...)
        const isValidSrc = (s) => s && (s.startsWith('data:') || s.startsWith('http'));
        let src = null;
        
        if (isValidSrc(localStorage.getItem(`avatarImage:${user.id}`))) {
          src = localStorage.getItem(`avatarImage:${user.id}`);
        } else if (isValidSrc(localStorage.getItem('avatarImage'))) {
          src = localStorage.getItem('avatarImage');
        } else if (isValidSrc(user.avatar)) {
          src = user.avatar;
        }
        
        if (src) {
          avatarEl.src = src;
        } else {
          // Fallback: generate from display name so it always looks correct
          const name = encodeURIComponent(user.displayName || user.name || 'User');
          avatarEl.src = `https://ui-avatars.com/api/?name=${name}&background=3b82f6&color=fff`;
        }
      }
    }
  }

  // ── Sync theme button label with current state ───────────────
  syncSidebarThemeBtn();

  // ── Theme toggle ─────────────────────────────────────────────
  document.getElementById('sidebarThemeBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const isDark = document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', !isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'light' : 'dark');
    syncSidebarThemeBtn();
    // Also update avatar-menu theme button if present on page
    const topBtn = document.getElementById('themeToggleBtnTop');
    if (topBtn) {
      const i = topBtn.querySelector('i');
      const t = topBtn.querySelector('.menu-text');
      if (i) i.className    = !isDark ? 'bx bx-moon' : 'bx bx-sun';
      if (t) t.textContent  = !isDark ? 'Dark Mode'  : 'Light Mode';
    }
  });

  // ── Logout ───────────────────────────────────────────────────
  document.getElementById('sidebarLogoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.Auth?.logout?.();
    window.location.href = '../login&register/Login/login.html';
  });

});