// Require Admin Login
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || currentUser.role !== "admin") {
  window.location.href = "../login&register/Login/login.html";
}

// ===== LOAD AVATAR & NAME FROM LOCALSTORAGE =====
(function loadHeaderProfile() {
  const DEFAULT_AVATAR = "../Photo/person.png";

  // Priority: auth compat keys > currentUser object > defaults
  const savedAvatar = localStorage.getItem("avatarImage");
  const savedName = localStorage.getItem("userName");

  const avatarSrc = savedAvatar || (currentUser && currentUser.avatar) || DEFAULT_AVATAR;
  const displayName = savedName || (currentUser && currentUser.displayName) || (currentUser && currentUser.email) || "Admin";

  // Apply to header elements when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    const avatarEl = document.getElementById("headerAdminAvatar");
    const nameEl = document.getElementById("headerAdminName");

    if (avatarEl) avatarEl.src = avatarSrc;
    if (nameEl) nameEl.textContent = displayName;
  });

  // Listen for changes from other tabs (e.g., profile page updates avatar)
  window.addEventListener("storage", function (e) {
    if (e.key === "avatarImage" || e.key === "userName") {
      const avatarEl = document.getElementById("headerAdminAvatar");
      const nameEl = document.getElementById("headerAdminName");

      if (e.key === "avatarImage" && avatarEl) {
        avatarEl.src = e.newValue || DEFAULT_AVATAR;
      }
      if (e.key === "userName" && nameEl) {
        nameEl.textContent = e.newValue || "Admin";
      }
    }
  });
})();

$(document).ready(function () {
  function updateAdminDashboard(filterStatus = "all") {
    const tasks = TaskService.getAll(); //Lấy dữ liệu từ LocalStorage
    const today = new Date().toISOString().split("T")[0];
    // Cập nhật các con số thống kê
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
    $("#mediumPriority").text(
      tasks.filter((t) => t.priority === "Medium").length,
    );
    const $list = $("#recentTasksList");
    const $empty = $("#noTasksMsg");

    if (tasks.length > 0) {
      $empty.addClass("d-none");
      // Út tiên cái nào đặt trước là để trước (sort by createdAt ascending)
      const recent = [...tasks].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );
      $list.html(
        recent
          .map((t) => {
            const statusOptions = [
              "Pending",
              "Delivering",
              "Done",
              "Cancelled",
            ];
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
            const displayTime = isNaN(createdAtDate.getTime())
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
    } else {
      $empty.removeClass("d-none");
      $list.empty();
    }
  }

  // Chạy ngay khi load
  updateAdminDashboard();

  // Lắng nghe thay đổi trạng thái
  $(document).on("change", ".status-select", function () {
    const id = $(this).data("id");
    const newStatus = $(this).val();
    TaskService.update(id, { status: newStatus });
    updateAdminDashboard();
  });

  // Hiệu ứng click cho tất cả button (đã yêu cầu)
  $(".btn").on("click", function () {
    console.log("Đã click: " + $(this).attr("title"));
  });
});
$(function () {
  // ===== DARK MODE =====
  const html = document.documentElement;
  const toggle = document.getElementById("darkToggle");
  const themeIcon = document.getElementById("themeIcon");

  // Load saved theme
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
