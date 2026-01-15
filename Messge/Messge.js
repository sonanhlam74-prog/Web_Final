document.addEventListener('DOMContentLoaded', () => {
  // Require login for this page
  if (window.Auth) {
    window.Auth.requireLogin({ redirectTo: '../login&register/Login/login_site.html' });
  }

  const NAME_STORAGE_KEY = 'userName';
  const AVATAR_STORAGE_KEY = 'avatarImage';
  const MESSAGES_KEY = 'demoMessages';

  const $ = (id) => document.getElementById(id);

  const meName = $('meName');
  const meAvatar = $('meAvatar');
  const messagesEl = $('messages');
  const composer = $('composer');
  const input = $('messageInput');
  const clearBtn = $('clearBtn');

  const safeText = (value) => (value ?? '').toString();

  const formatTime = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const loadMe = () => {
    const currentUser = window.Auth?.getCurrentUser?.() || null;
    const name = currentUser?.displayName || localStorage.getItem(NAME_STORAGE_KEY) || 'Người dùng';
    if (meName) meName.textContent = name;

    const avatar = currentUser?.avatar || localStorage.getItem(AVATAR_STORAGE_KEY);
    if (meAvatar) {
      if (avatar) {
        meAvatar.src = avatar;
      } else {
        // Tiny inline fallback (purple circle) to avoid broken image icon
        meAvatar.src = 'data:image/svg+xml;utf8,' +
          encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="#7c3aed"/><stop offset="1" stop-color="#22c55e"/></linearGradient></defs><rect width="80" height="80" rx="40" fill="url(#g)"/></svg>');
      }
    }

    // Keep compatibility key in sync
    if (currentUser?.avatar) {
      try {
        localStorage.setItem(AVATAR_STORAGE_KEY, currentUser.avatar);
      } catch {
        // ignore
      }
    }
  };

  const loadMessages = () => {
    try {
      const raw = localStorage.getItem(MESSAGES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveMessages = (messages) => {
    try {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    } catch {
      // ignore quota errors
    }
  };

  const render = () => {
    if (!messagesEl) return;

    const messages = loadMessages();
    messagesEl.innerHTML = '';

    if (messages.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'msg';
      empty.innerHTML = '<div>Chưa có tin nhắn. Hãy gửi tin đầu tiên!</div><div class="meta">Mẹo: Enter để gửi</div>';
      messagesEl.appendChild(empty);
      return;
    }

    for (const m of messages) {
      const item = document.createElement('div');
      item.className = 'msg' + (m.from === 'me' ? ' me' : '');
      const text = safeText(m.text).trim();
      item.innerHTML = `<div>${escapeHtml(text)}</div><div class="meta">${formatTime(m.ts)}</div>`;
      messagesEl.appendChild(item);
    }

    messagesEl.scrollTop = messagesEl.scrollHeight;
  };

  const escapeHtml = (str) =>
    safeText(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const send = (text) => {
    const clean = safeText(text).trim();
    if (!clean) return;

    const messages = loadMessages();
    messages.push({
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      text: clean,
      ts: Date.now(),
      from: 'me',
    });

    // Auto-reply (demo)
    messages.push({
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + 1),
      text: 'Mình đã nhận được: ' + clean,
      ts: Date.now() + 250,
      from: 'bot',
    });

    saveMessages(messages);
    render();
  };

  composer?.addEventListener('submit', (e) => {
    e.preventDefault();
    send(input?.value);
    if (input) input.value = '';
    input?.focus();
  });

  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      composer?.requestSubmit?.();
    }
  });

  clearBtn?.addEventListener('click', () => {
    localStorage.removeItem(MESSAGES_KEY);
    render();
  });

  loadMe();
  render();
});
