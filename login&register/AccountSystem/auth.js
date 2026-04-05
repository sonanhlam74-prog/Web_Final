(function (global) {
  "use strict";

  const USERS_KEY = "auth.users.v1";
  const SESSION_KEY = "auth.session.v1";
  const LOCKS_KEY = "auth.locks.v1";

  const PASSWORD_MIN_LEN = 8;
  const MAX_FAILS = 5;
  const LOCK_MS = 2 * 60 * 1000; // 2 minutes

  const DEFAULT_AVATAR = "../../Photo/person.png";

  const COMPAT_NAME_KEY = "userName";
  const COMPAT_AVATAR_KEY = "avatarImage";
  const VALID_ROLES = new Set(["admin", "staff", "user"]);
  const VALID_STATUSES = new Set(["active", "disabled"]);

  function nowMs() {
    return Date.now();
  }

  function safeJsonParse(text, fallback) {
    try {
      const v = JSON.parse(text);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  }

  function loadObject(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return safeJsonParse(raw, fallback);
  }

  function saveObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeEmail(email) {
    return String(email || "")
      .trim()
      .toLowerCase();
  }

  function normalizeRole(role, email) {
    const nextRole = String(role || "").trim().toLowerCase();
    if (VALID_ROLES.has(nextRole)) return nextRole;
    return normalizeEmail(email).startsWith("admin") ? "admin" : "user";
  }

  function normalizeStatus(status) {
    const nextStatus = String(status || "").trim().toLowerCase();
    if (nextStatus === "inactive") return "disabled";
    return VALID_STATUSES.has(nextStatus) ? nextStatus : "active";
  }

  function toCompatUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.displayName || user.email.split("@")[0],
      username: user.email,
      displayName: user.displayName,
      avatar: user.avatar || DEFAULT_AVATAR,
      role: normalizeRole(user.role, user.email),
      status: normalizeStatus(user.status),
      accumulatedSpend: Number(user.accumulatedSpend || 0),
    };
  }

  function syncCompatCurrentUser(user) {
    try {
      if (!user) {
        localStorage.removeItem("currentUser");
        return;
      }

      localStorage.setItem(
        COMPAT_NAME_KEY,
        user.displayName || "Người dùng",
      );
      localStorage.setItem(COMPAT_AVATAR_KEY, user.avatar || DEFAULT_AVATAR);
      localStorage.setItem("currentUser", JSON.stringify(toCompatUser(user)));
    } catch {
      // ignore compatibility storage failures
    }
  }

  function normalizeUserRecord(user) {
    if (!user || typeof user !== "object") return null;

    const id = String(user.id || "").trim();
    const email = normalizeEmail(user.email);
    const passwordHash = String(user.passwordHash || "").trim();
    if (!id || !email || !passwordHash) return null;

    return {
      ...user,
      id,
      email,
      passwordHash,
      displayName: String(user.displayName || email.split("@")[0] || "Người dùng"),
      avatar: String(user.avatar || "").trim() || DEFAULT_AVATAR,
      role: normalizeRole(user.role, email),
      status: normalizeStatus(user.status),
      accumulatedSpend: Number(user.accumulatedSpend || 0),
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString(),
    };
  }

  function validatePasswordComplexity(password, label) {
    const p = String(password || "");
    const name = label || "Mật khẩu";

    if (PASSWORD_MIN_LEN > 0 && p.length < PASSWORD_MIN_LEN) {
      return {
        ok: false,
        code: "weak_password",
        message: `${name} tối thiểu ${PASSWORD_MIN_LEN} ký tự.`,
      };
    }
    if (/\s/.test(p)) {
      return {
        ok: false,
        code: "invalid_password",
        message: `${name} không được chứa khoảng trắng.`,
      };
    }
    if (!/[a-z]/.test(p)) {
      return {
        ok: false,
        code: "invalid_password",
        message: `${name} phải có ít nhất 1 chữ thường.`,
      };
    }
    if (!/[A-Z]/.test(p)) {
      return {
        ok: false,
        code: "invalid_password",
        message: `${name} phải có ít nhất 1 chữ in hoa.`,
      };
    }
    if (!/[0-9]/.test(p)) {
      return {
        ok: false,
        code: "invalid_password",
        message: `${name} phải có ít nhất 1 chữ số.`,
      };
    }
    return { ok: true };
  }

  function isValidEmail(email) {
    const e = normalizeEmail(email);
    // reasonable client-side check, not RFC-complete
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  function randomId(prefix) {
    const bytes = new Uint8Array(16);
    if (global.crypto?.getRandomValues) {
      global.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i += 1)
        bytes[i] = Math.floor(Math.random() * 256);
    }
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return `${prefix}_${hex}`;
  }

  async function sha256Hex(input) {
    const text = String(input ?? "");

    if (global.crypto?.subtle && global.TextEncoder) {
      const data = new TextEncoder().encode(text);
      const digest = await global.crypto.subtle.digest("SHA-256", data);
      const bytes = new Uint8Array(digest);
      return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    // Fallback (NOT cryptographically secure; avoids breaking on file:// where subtle may be unavailable)
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a_${(hash >>> 0).toString(16)}`;
  }

  function getUsers() {
    const rawUsers = loadObject(USERS_KEY, []);
    if (!Array.isArray(rawUsers)) return [];

    const normalizedUsers = [];
    let changed = false;

    for (const user of rawUsers) {
      const normalized = normalizeUserRecord(user);
      if (!normalized) {
        changed = true;
        continue;
      }

      normalizedUsers.push(normalized);

      if (
        user.role !== normalized.role ||
        user.status !== normalized.status ||
        user.avatar !== normalized.avatar ||
        user.displayName !== normalized.displayName ||
        Number(user.accumulatedSpend || 0) !== normalized.accumulatedSpend
      ) {
        changed = true;
      }
    }

    if (changed || normalizedUsers.length !== rawUsers.length) {
      setUsers(normalizedUsers);
    }

    return normalizedUsers;
  }

  function setUsers(users) {
    saveObject(USERS_KEY, users);
  }

  function getLocks() {
    const locks = loadObject(LOCKS_KEY, {});
    return locks && typeof locks === "object" ? locks : {};
  }

  function setLocks(locks) {
    saveObject(LOCKS_KEY, locks);
  }

  function clearLock(email) {
    const locks = getLocks();
    const key = normalizeEmail(email);
    if (locks[key]) {
      delete locks[key];
      setLocks(locks);
    }
  }

  function registerFail(email) {
    const locks = getLocks();
    const key = normalizeEmail(email);
    const current = locks[key] || { fails: 0, lockUntil: 0 };

    const nextFails = (current.fails || 0) + 1;
    const shouldLock = nextFails >= MAX_FAILS;

    locks[key] = {
      fails: shouldLock ? 0 : nextFails,
      lockUntil: shouldLock ? nowMs() + LOCK_MS : 0,
    };

    setLocks(locks);

    return locks[key];
  }

  function getLockState(email) {
    const locks = getLocks();
    const key = normalizeEmail(email);
    const state = locks[key];
    if (!state) return { locked: false, remainingMs: 0 };

    const until = Number(state.lockUntil || 0);
    const remaining = Math.max(0, until - nowMs());
    if (remaining <= 0) {
      delete locks[key];
      setLocks(locks);
      return { locked: false, remainingMs: 0 };
    }

    return { locked: true, remainingMs: remaining };
  }

  function getSession() {
    return loadObject(SESSION_KEY, null);
  }

  function setSession(session) {
    saveObject(SESSION_KEY, session);
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function findUserByEmail(email) {
    const e = normalizeEmail(email);
    return getUsers().find((u) => normalizeEmail(u.email) === e) || null;
  }

  function findUserById(id) {
    const users = getUsers();
    return users.find((u) => u.id === id) || null;
  }

  function getCurrentUser() {
    const session = getSession();
    if (!session?.userId) return null;
    const user = findUserById(session.userId);

    if (!user) {
      syncCompatCurrentUser(null);
      return null;
    }

    if (normalizeStatus(user.status) !== "active") {
      clearSession();
      syncCompatCurrentUser(null);
      return null;
    }

    syncCompatCurrentUser(user);
    return user;
  }

  function requireLogin(options) {
    const redirectTo = options?.redirectTo;
    if (!getCurrentUser() && redirectTo) {
      global.location.href = redirectTo;
      return false;
    }
    return true;
  }

  async function register(params) {
    const email = normalizeEmail(params?.email);
    const password = String(params?.password || "");

    if (!isValidEmail(email)) {
      return {
        ok: false,
        code: "invalid_email",
        message: "Email không hợp lệ.",
      };
    }

    const pwCheck = validatePasswordComplexity(password, "Mật khẩu");
    if (!pwCheck.ok) return pwCheck;
    if (findUserByEmail(email)) {
      return {
        ok: false,
        code: "email_exists",
        message: "Email này đã được đăng ký.",
      };
    }

    const passwordHash = await sha256Hex(password);

    const user = {
      id: randomId("u"),
      email,
      passwordHash,
      displayName: email.split("@")[0] || "Người dùng",
      avatar: DEFAULT_AVATAR,
      role: normalizeRole(undefined, email),
      status: "active",
      accumulatedSpend: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const users = getUsers();
    users.push(user);
    setUsers(users);
    clearLock(email);

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
      },
    };
  }

  async function login(params) {
    const email = normalizeEmail(params?.email);
    const password = String(params?.password || "");

    if (!isValidEmail(email)) {
      return {
        ok: false,
        code: "invalid_email",
        message: "Email không hợp lệ.",
      };
    }

    const lock = getLockState(email);
    if (lock.locked) {
      const seconds = Math.ceil(lock.remainingMs / 1000);
      return {
        ok: false,
        code: "locked",
        message: `Bạn nhập sai quá nhiều lần. Thử lại sau ${seconds}s.`,
      };
    }

    let user = findUserByEmail(email);
    if (!user) {
      registerFail(email);
      return {
        ok: false,
        code: "invalid_credentials",
        message: "Sai email hoặc mật khẩu.",
      };
    }

    const passwordHash = await sha256Hex(password);
    if (passwordHash !== user.passwordHash) {
      registerFail(email);
      return {
        ok: false,
        code: "invalid_credentials",
        message: "Sai email hoặc mật khẩu.",
      };
    }

    if (normalizeStatus(user.status) !== "active") {
      return {
        ok: false,
        code: "account_disabled",
        message: "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.",
      };
    }

    clearLock(email);

    // Ensure avatar is always present (older saved accounts may have null)
    if (!user.avatar) {
      const users = getUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        users[idx] = {
          ...users[idx],
          avatar: DEFAULT_AVATAR,
          updatedAt: new Date().toISOString(),
        };
        setUsers(users);
        user = users[idx];
      } else {
        user = { ...user, avatar: DEFAULT_AVATAR };
      }
    }

    setSession({
      token: randomId("s"),
      userId: user.id,
      email: user.email,
      loginAt: new Date().toISOString(),
    });

    syncCompatCurrentUser(user);

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
      },
    };
  }

  function logout() {
    clearSession();
    // Also clear currentUser for backward compatibility
    syncCompatCurrentUser(null);
  }

  async function changePassword(params) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        ok: false,
        code: "not_logged_in",
        message: "Bạn chưa đăng nhập.",
      };
    }

    const oldPassword = String(params?.oldPassword || "");
    const newPassword = String(params?.newPassword || "");

    const pwCheck = validatePasswordComplexity(newPassword, "Mật khẩu mới");
    if (!pwCheck.ok) return pwCheck;

    const oldHash = await sha256Hex(oldPassword);
    if (oldHash !== currentUser.passwordHash) {
      return {
        ok: false,
        code: "wrong_old_password",
        message: "Mật khẩu hiện tại không đúng.",
      };
    }

    const newHash = await sha256Hex(newPassword);

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx === -1) {
      return {
        ok: false,
        code: "user_missing",
        message: "Không tìm thấy tài khoản.",
      };
    }

    users[idx] = {
      ...users[idx],
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    };
    setUsers(users);

    return { ok: true, message: "Đổi mật khẩu thành công." };
  }

  function updateCurrentUserProfile(params) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return {
        ok: false,
        code: "not_logged_in",
        message: "Bạn chưa đăng nhập.",
      };
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === currentUser.id);
    if (idx === -1) {
      return {
        ok: false,
        code: "user_missing",
        message: "Không tìm thấy tài khoản.",
      };
    }

    const nextDisplayName =
      params?.displayName !== undefined
        ? String(params.displayName || "").trim()
        : users[idx].displayName;
    const nextAvatar =
      params?.avatar !== undefined
        ? String(params.avatar || "").trim() || DEFAULT_AVATAR
        : users[idx].avatar;

    users[idx] = {
      ...users[idx],
      displayName: nextDisplayName || users[idx].displayName || "Người dùng",
      avatar: nextAvatar || DEFAULT_AVATAR,
      updatedAt: new Date().toISOString(),
    };
    setUsers(users);

    syncCompatCurrentUser(users[idx]);

    return {
      ok: true,
      user: {
        id: users[idx].id,
        email: users[idx].email,
        displayName: users[idx].displayName,
        avatar: users[idx].avatar,
        role: users[idx].role,
        status: users[idx].status,
      },
    };
  }

  function setCurrentUserAvatar(avatar) {
    return updateCurrentUserProfile({ avatar });
  }

  function updateUserAccessByAdmin(params) {
    const adminUser = getCurrentUser();
    if (!adminUser || normalizeRole(adminUser.role, adminUser.email) !== "admin") {
      return {
        ok: false,
        code: "forbidden",
        message: "Bạn không có quyền thực hiện thao tác này.",
      };
    }

    const userId = String(params?.userId || "").trim();
    if (!userId) {
      return {
        ok: false,
        code: "invalid_user_id",
        message: "Thiếu userId hợp lệ.",
      };
    }

    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return {
        ok: false,
        code: "user_missing",
        message: "Không tìm thấy tài khoản.",
      };
    }

    const target = users[idx];
    if (normalizeRole(target.role, target.email) === "admin") {
      return {
        ok: false,
        code: "forbidden_target",
        message: "Không thể sửa quyền hoặc trạng thái của tài khoản Admin.",
      };
    }

    let nextRole = target.role;
    if (params?.role !== undefined) {
      const requestedRole = String(params.role || "").trim().toLowerCase();
      if (requestedRole !== "user" && requestedRole !== "staff") {
        return {
          ok: false,
          code: "invalid_role",
          message: "Vai trò hợp lệ: user hoặc staff.",
        };
      }
      nextRole = requestedRole;
    }

    let nextStatus = target.status;
    if (params?.status !== undefined) {
      const requestedStatus = normalizeStatus(params.status);
      if (!VALID_STATUSES.has(requestedStatus)) {
        return {
          ok: false,
          code: "invalid_status",
          message: "Trạng thái hợp lệ: active hoặc disabled.",
        };
      }
      nextStatus = requestedStatus;
    }

    users[idx] = {
      ...target,
      role: nextRole,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
    setUsers(users);

    return {
      ok: true,
      user: {
        id: users[idx].id,
        email: users[idx].email,
        displayName: users[idx].displayName,
        avatar: users[idx].avatar,
        role: users[idx].role,
        status: users[idx].status,
      },
    };
  }

  function getUsersView() {
    return getUsers().map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      accumulatedSpend: Number(user.accumulatedSpend || 0),
    }));
  }

  function getDefaultAvatar() {
    return DEFAULT_AVATAR;
  }
  function getCurrentAvatarUser() {
    const currentUser = getCurrentUser();
    if (!currentUser) return null;
    return currentUser.avatar || null;
  }
  global.Auth = {
    register,
    login,
    logout,
    changePassword,
    getCurrentUser,
    requireLogin,
    updateCurrentUserProfile,
    setCurrentUserAvatar,
    updateUserAccessByAdmin,
    getUsersView,
    getDefaultAvatar,
    getCurrentAvatarUser,
    findUserByEmail,
    getUsers,
    setUsers,
    sha256Hex,
    validatePasswordComplexity,
    clearLock,
    // exposed for debugging
    _keys: { USERS_KEY, SESSION_KEY, LOCKS_KEY },
  };
})(window);
