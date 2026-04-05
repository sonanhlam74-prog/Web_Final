// ===== AUTH BOOTSTRAP + ADMIN GUARD =====
const DEFAULT_ADMIN_AVATAR = "https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff";

function toCompatUser(authUser) {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email,
    name: authUser.displayName || authUser.email.split("@")[0],
    username: authUser.email,
    displayName: authUser.displayName,
    avatar: authUser.avatar || "../Photo/person.png",
    role: authUser.role || (authUser.email.startsWith("admin") ? "admin" : "user"),
    status: authUser.status || "active",
    accumulatedSpend: Number(authUser.accumulatedSpend || 0),
  };
}

let currentUser = null;

(function bootstrapAdminContext() {
  const authUser = window.Auth?.getCurrentUser?.() || null;
  if (!authUser) {
    window.location.href = "../login&register/Login/login.html";
    return;
  }

  currentUser = toCompatUser(authUser);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));

  if (!currentUser || currentUser.status === "disabled") {
    window.Auth?.logout?.();
    window.location.href = "../login&register/Login/login.html";
    return;
  }

  if ((currentUser.role || "user") !== "admin") {
    window.location.href = "../Test app/main.html";
  }
})();

// ===== LOAD AVATAR & NAME FROM LOCALSTORAGE =====
(function loadHeaderProfile() {
  const savedAvatar = localStorage.getItem("avatarImage");
  const savedName = localStorage.getItem("userName");

  const isValidSrc = (s) => s && (s.startsWith("data:") || s.startsWith("http"));
  let avatarSrc = DEFAULT_ADMIN_AVATAR;
  if (isValidSrc(savedAvatar)) {
    avatarSrc = savedAvatar;
  } else if (currentUser && isValidSrc(currentUser.avatar)) {
    avatarSrc = currentUser.avatar;
  }

  const displayName = savedName || currentUser?.displayName || currentUser?.email || "Admin";

  document.addEventListener("DOMContentLoaded", function () {
    const avatarEl = document.getElementById("headerAdminAvatar");
    const nameEl = document.getElementById("headerAdminName");
    if (avatarEl) avatarEl.src = avatarSrc;
    if (nameEl) nameEl.textContent = displayName;
  });

  window.addEventListener("storage", function (e) {
    if (e.key === "avatarImage" || e.key === "userName") {
      const avatarEl = document.getElementById("headerAdminAvatar");
      const nameEl = document.getElementById("headerAdminName");

      if (e.key === "avatarImage" && avatarEl) {
        const nextAvatar = e.newValue;
        avatarEl.src = isValidSrc(nextAvatar) ? nextAvatar : DEFAULT_ADMIN_AVATAR;
      }
      if (e.key === "userName" && nameEl) {
        nameEl.textContent = e.newValue || "Admin";
      }
    }
  });
})();

function formatDateTime(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getUsersForManage() {
  if (!window.Auth) return [];
  if (typeof window.Auth.getUsersView === "function") {
    return window.Auth.getUsersView();
  }
  return (window.Auth.getUsers?.() || []).map((u) => ({
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    avatar: u.avatar,
    role: u.role || (u.email?.startsWith("admin") ? "admin" : "user"),
    status: u.status || "active",
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

function getRoleLabel(role) {
  if (role === "admin") return "Quản trị viên";
  if (role === "staff") return "Nhân viên";
  return "Khách hàng";
}

function getStatusLabel(status) {
  return status === "disabled" ? "Vô hiệu" : "Hoạt động";
}

function showUserFeedback(message, isError = false) {
  const feedbackEl = document.getElementById("userManageFeedback");
  if (!feedbackEl) return;
  feedbackEl.textContent = message || "";
  feedbackEl.classList.remove("text-success", "text-danger", "text-muted");
  feedbackEl.classList.add(message ? (isError ? "text-danger" : "text-success") : "text-muted");
}

function renderUserAccounts() {
  const users = getUsersForManage();
  const $tbody = $("#userAccountsList");
  const $empty = $("#noUsersMsg");

  if (!users.length) {
    $tbody.empty();
    $empty.removeClass("d-none");
    return;
  }

  $empty.addClass("d-none");

  const rows = users
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .map((user) => {
      const isAdminAccount = user.role === "admin";
      const roleControl = isAdminAccount
        ? `<span class="badge bg-primary-subtle text-primary-emphasis">${getRoleLabel(user.role)}</span>`
        : `<select class="form-select form-select-sm user-manage-select user-role-select" data-id="${user.id}">
            <option value="user" ${user.role === "user" ? "selected" : ""}>Khách hàng</option>
            <option value="staff" ${user.role === "staff" ? "selected" : ""}>Nhân viên</option>
          </select>`;

      const statusControl = isAdminAccount
        ? `<span class="badge bg-success-subtle text-success-emphasis">${getStatusLabel(user.status)}</span>`
        : `<select class="form-select form-select-sm user-manage-select user-status-select" data-id="${user.id}">
            <option value="active" ${user.status === "active" ? "selected" : ""}>Hoạt động</option>
            <option value="disabled" ${user.status === "disabled" ? "selected" : ""}>Vô hiệu</option>
          </select>`;

      return `
        <tr>
          <td class="text-start ps-4 fw-semibold">${user.displayName || "Người dùng"}</td>
          <td>${user.email || "--"}</td>
          <td>${roleControl}</td>
          <td>${statusControl}</td>
          <td class="text-muted" style="font-size:0.8rem;">${formatDateTime(user.updatedAt || user.createdAt)}</td>
        </tr>
      `;
    })
    .join("");

  $tbody.html(rows);
}

$(document).ready(function () {
  function updateAdminDashboard() {
    const tasks = TaskService.getAll();

    $("#totalTasks").text(tasks.length);
    $("#completedTasks").text(tasks.filter((t) => t.status === "Done").length);
    $("#pendingTasks").text(tasks.filter((t) => t.status === "Pending").length);
    $("#overdueTasks").text(
      tasks.filter((t) => {
        const today = new Date().toISOString().split("T")[0];
        return t.deadline < today && t.status !== "Done";
      }).length,
    );
    $("#highPriority").text(tasks.filter((t) => t.priority === "High").length);
    $("#mediumPriority").text(tasks.filter((t) => t.priority === "Medium").length);

    const $list = $("#recentTasksList");
    const $empty = $("#noTasksMsg");

    if (!tasks.length) {
      $empty.removeClass("d-none");
      $list.empty();
      return;
    }

    $empty.addClass("d-none");
    const recent = [...tasks].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    $list.html(
      recent
        .map((t) => {
          const statusOptions = ["Pending", "Delivering", "Done", "Cancelled"];
          const getStatusBadgeClass = (status) => {
            if (status === "Done") return "bg-success";
            if (status === "Delivering") return "bg-primary";
            if (status === "Cancelled") return "bg-danger";
            return "bg-info text-dark";
          };
          const getStatusLabel = (status) => {
            const labels = {
              Pending: "Chờ xử lý",
              Delivering: "Đang giao",
              Done: "Hoàn thành",
              Cancelled: "Đã hủy",
            };
            return labels[status] || status;
          };

          const createdAtDate = new Date(t.createdAt);
          const displayTime = Number.isNaN(createdAtDate.getTime())
            ? t.deadline
            : createdAtDate.toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

          return `
            <tr>
              <td class="fw-bold text-start">${t.title}</td>
              <td><span class="badge ${t.priority === "High" ? "bg-danger" : t.priority === "Medium" ? "bg-warning text-dark" : "bg-secondary"}">${t.priority}</span></td>
              <td class="text-muted" style="font-size: 0.9rem;">${displayTime}</td>
              <td>
                <select class="form-select form-select-sm status-select fw-bold text-white border-0 ${getStatusBadgeClass(t.status)}" data-id="${t.id}" style="width: auto; display: inline-block; padding: 4px 28px 4px 12px; border-radius: 50rem;">
                  ${statusOptions.map((opt) => `<option value="${opt}" ${t.status === opt ? "selected" : ""} class="text-dark bg-white">${getStatusLabel(opt)}</option>`).join("")}
                </select>
              </td>
            </tr>
          `;
        })
        .join(""),
    );
  }

  updateAdminDashboard();
  renderUserAccounts();

  $(document).on("change", ".status-select", function () {
    const id = $(this).data("id");
    const newStatus = $(this).val();
    TaskService.update(id, { status: newStatus });
    updateAdminDashboard();
  });

  $(document).on("change", ".user-role-select", function () {
    const userId = $(this).data("id");
    const role = $(this).val();
    const res = window.Auth?.updateUserAccessByAdmin?.({ userId, role });
    if (!res?.ok) {
      showUserFeedback(res?.message || "Không thể cập nhật vai trò.", true);
      renderUserAccounts();
      return;
    }
    showUserFeedback("Đã cập nhật vai trò tài khoản thành công.");
    renderUserAccounts();
  });

  $(document).on("change", ".user-status-select", function () {
    const userId = $(this).data("id");
    const status = $(this).val();
    const res = window.Auth?.updateUserAccessByAdmin?.({ userId, status });
    if (!res?.ok) {
      showUserFeedback(res?.message || "Không thể cập nhật trạng thái tài khoản.", true);
      renderUserAccounts();
      return;
    }
    showUserFeedback(
      status === "disabled"
        ? "Đã vô hiệu hóa tài khoản. Người dùng sẽ không thể đăng nhập."
        : "Đã kích hoạt lại tài khoản thành công.",
    );
    renderUserAccounts();
  });
});

$(function () {
  // ===== DARK MODE =====
  const html = document.documentElement;
  const toggle = document.getElementById("darkToggle");
  const themeIcon = document.getElementById("themeIcon");

  const savedTheme = localStorage.getItem("flowershop-theme");
  if (savedTheme === "dark") {
    html.classList.remove("light");
    html.classList.add("dark");
    themeIcon.classList.remove("bx-sun");
    themeIcon.classList.add("bx-moon");
  }

  toggle.addEventListener("click", () => {
    html.classList.toggle("dark");
    html.classList.toggle("light");
    const isDark = html.classList.contains("dark");
    localStorage.setItem("flowershop-theme", isDark ? "dark" : "light");
    themeIcon.classList.toggle("bx-sun", !isDark);
    themeIcon.classList.toggle("bx-moon", isDark);
  });

  // ===== MOBILE SIDEBAR =====
  $("#btnOpenSidebar").on("click", function () {
    $("#sidebar").addClass("show");
    $("#sidebarOverlay").addClass("show");
  });
  $("#sidebarOverlay").on("click", function () {
    $("#sidebar").removeClass("show");
    $(this).removeClass("show");
  });

  // ===== SEARCH =====
  $("#searchInput").on("input", function () {
    const query = $(this).val().toLowerCase().trim();
    $("#recentTasksList tr").each(function () {
      const text = $(this).text().toLowerCase();
      $(this).toggle(text.includes(query));
    });
  });
});
