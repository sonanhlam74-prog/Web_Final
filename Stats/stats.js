// ===== AUTH GUARD =====
// Redirect to login if not authenticated
if (window.Auth) {
  const currentUser = window.Auth.getCurrentUser();
  if (!currentUser) {
    window.location.href = "../login&register/Login/login.html";
  }
}

// ===== LOAD AVATAR & NAME FROM LOCALSTORAGE =====
(function loadHeaderProfile() {
  const DEFAULT_AVATAR = "../Photo/person.png";
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

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
  function parseRevenue(description) {
    if (!description) return 0;
    // Look for "Tổng tiền: 1.050.000 VND" or similar in the text
    const match = description.match(/Tổng tiền:\s*([\d\.]+)\s*VND/i);
    if (match && match[1]) {
      return parseInt(match[1].replace(/\./g, ""), 10);
    }
    return 0; // If not an order or format is wrong, revenue is 0
  }

  function formatPrice(num) {
    new Intl.NumberFormat("vi-VN").format(num) + " VND";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "tr VND";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K VND";
    return num + " VND";
  }

  function renderStats(timeframe = "week") {
    const allTasks = TaskService.getAll();

    let filteredOrders = allTasks.filter(
      (t) =>
        t.title.toLowerCase().includes("đơn hàng") ||
        parseRevenue(t.description) > 0,
    );

    // Timeframe filtering
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(
      startOfWeek.getDate() -
        startOfWeek.getDay() +
        (startOfWeek.getDay() === 0 ? -6 : 1),
    ); // Monday as start
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    filteredOrders = filteredOrders.filter((order) => {
      if (!order.createdAt) return true; // Fallback
      const orderDate = new Date(order.createdAt);
      if (timeframe === "today") return orderDate >= startOfDay;
      if (timeframe === "week") return orderDate >= startOfWeek;
      if (timeframe === "month") return orderDate >= startOfMonth;
      return true; // 'all'
    });

    const orders = filteredOrders;

    let totalRevenue = 0;
    let completed = 0;
    let pending = 0;
    let cancelled = 0;
    let delivering = 0;

    // Revenue grouping for bar chart
    const revenueByKey = {};

    orders.forEach((order) => {
      const rev = parseRevenue(order.description);
      if (order.status === "Done") {
        totalRevenue += rev;
      }
      if (order.status === "Done") completed++;
      else if (order.status === "Cancelled") cancelled++;
      else if (order.status === "Delivering") delivering++;
      else pending++;

      // Chart grouping
      let key = "N/A";
      if (order.createdAt) {
        const od = new Date(order.createdAt);
        if (timeframe === "today") {
          key = od.getHours() + ":00";
        } else {
          key = od.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
          });
        }
      }
      revenueByKey[key] = (revenueByKey[key] || 0) + rev;
    });

    // Update Summary Cards
    $("#totalRevenue").text(formatPrice(totalRevenue));
    $("#totalOrders").text(orders.length);
    $("#completedOrders").text(completed);
    $("#pendingOrders").text(pending);

    // Update Charts
    updateCharts(
      { pending, delivering, completed, cancelled },
      revenueByKey,
      timeframe,
    );

    // Render Table
    const $tbody = $("#ordersTableBody");
    const $emptyMsg = $("#noOrdersMsg");

    if (orders.length === 0) {
      $emptyMsg.removeClass("d-none");
      $tbody.empty();
      return;
    }

    $emptyMsg.addClass("d-none");

    const rowsHtml = orders
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((order) => {
        const revenue = parseRevenue(order.description);

        // Extract customer info from description for cleaner display
        let customerInfo = "Khách vãng lai";
        if (order.description) {
          const custMatch = order.description.match(/Khách hàng:\s*(.*)/);
          if (custMatch && custMatch[1]) {
            customerInfo = custMatch[1].split("\n")[0];
          } else {
            customerInfo = order.title;
          }
        } else {
          customerInfo = order.title;
        }

        const dateStr = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : order.deadline || "N/A";

        const getStatusBadgeClass = (status) => {
          if (status === "Done")
            return "bg-success bg-opacity-10 text-success border border-success";
          if (status === "Delivering")
            return "bg-primary bg-opacity-10 text-primary border border-primary";
          if (status === "Cancelled")
            return "bg-danger bg-opacity-10 text-danger border border-danger";
          return "bg-warning bg-opacity-10 text-warning border border-warning";
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

        return `
                <tr>
                    <td class="ps-4 fw-semibold text-secondary">#${order.id.substring(0, 6).toUpperCase()}</td>
                    <td>${dateStr}</td>
                    <td>
                        <div class="fw-bold text-dark">${customerInfo}</div>
                        <div class="text-muted small text-truncate" style="max-width: 250px;" title="${(order.description || "").replace(/"/g, "&quot;")}">${order.description || ""}</div>
                    </td>
                    <td class="fw-bold text-primary">${formatPrice(revenue)}</td>
                    <td>
                        <span class="badge ${getStatusBadgeClass(order.status)} w-100" style="padding: 6px 12px; border-radius: 6px;">
                            ${getStatusLabel(order.status)}
                        </span>
                    </td>
                </tr>
            `;
      })
      .join("");

    $tbody.html(rowsHtml);
  }

  let pieChartInstance = null;
  let barChartInstance = null;

  function updateCharts(statusData, revenueData, timeframe) {
    // Pie Chart setup
    const pieCtx = document.getElementById("statusPieChart").getContext("2d");
    if (pieChartInstance) pieChartInstance.destroy();

    const hasData =
      statusData.pending > 0 ||
      statusData.delivering > 0 ||
      statusData.completed > 0 ||
      statusData.cancelled > 0;

    pieChartInstance = new Chart(pieCtx, {
      type: "doughnut",
      data: {
        labels: ["Chờ xử lý", "Đang giao", "Hoàn thành", "Đã hủy"],
        datasets: [
          {
            data: hasData
              ? [
                  statusData.pending,
                  statusData.delivering,
                  statusData.completed,
                  statusData.cancelled,
                ]
              : [1],
            backgroundColor: hasData
              ? ["#f59e0b", "#3b82f6", "#10b981", "#ef4444"]
              : ["#e2e8f0"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { usePointStyle: true, padding: 20 },
          },
          tooltip: { enabled: hasData },
        },
      },
    });

    // Bar Chart setup
    const barCtx = document.getElementById("revenueBarChart").getContext("2d");
    if (barChartInstance) barChartInstance.destroy();

    // Sort revenue data keys chronological
    const labels = Object.keys(revenueData).sort((a, b) => {
      if (timeframe === "today") return parseInt(a) - parseInt(b); // sort by hour
      return a.localeCompare(b); // basically sort vi-VN datestrings lexicographically (approximated for demo)
    });
    const values = labels.map((l) => revenueData[l]);

    barChartInstance = new Chart(barCtx, {
      type: "bar",
      data: {
        labels: labels.length ? labels : ["Chưa có dữ liệu"],
        datasets: [
          {
            label: "Doanh thu (VND)",
            data: labels.length ? values : [0],
            backgroundColor: "#8b5cf6",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value) => value.toLocaleString("vi-VN") },
          },
          x: { grid: { display: false } },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Default load
  renderStats("week");

  // Filter change
  $("#timeframeSelect").change(function () {
    renderStats($(this).val());
  });

  $("#btnExportStats").click(function () {
    alert("Tính năng xuất báo cáo Excel đang được phát triển!");
  });
});
// ===== DARK MODE =====
const html = document.documentElement;
const toggle = document.getElementById("darkToggle");
const themeIcon = document.getElementById("themeIcon");

// Load saved theme (synced with dashboard via same localStorage key)
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
  $("#ordersTableBody tr").each(function () {
    const text = $(this).text().toLowerCase();
    $(this).toggle(text.includes(query));
  });
});
