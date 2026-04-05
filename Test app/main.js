const FLOWER_TYPE_BY_SECTION = {
  "hoa-tet": "tet",
  "hoa-chia-buon": "chia_buon",
  "hoa-chuc-mung": "chuc_mung",
  "hoa-sinh-nhat": "sinh_nhat",
  "hoa-cuoi": "cuoi",
};

const STOCK_THRESHOLD_PRICE = 1800000;

function parsePriceToNumber(text) {
  return Number(String(text || "").replace(/[^0-9]/g, "")) || 0;
}

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

function inferStockStatusByPrice(priceValue) {
  return priceValue >= STOCK_THRESHOLD_PRICE ? "out_of_stock" : "available";
}

function isFilterActive(query, minPrice, maxPrice, typeFilter, statusFilter) {
  return Boolean(query) || minPrice !== null || maxPrice !== null || typeFilter !== "all" || statusFilter !== "all";
}

function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

let currentUser = safeJsonParse(localStorage.getItem("currentUser") || "null", null);
const isGuestLocal = currentUser && currentUser.role === "guest";
const authUser = window.Auth && !isGuestLocal ? window.Auth.getCurrentUser?.() : null;

if (authUser) {
  currentUser = toCompatUser(authUser);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
} else if (!isGuestLocal) {
  currentUser = safeJsonParse(localStorage.getItem("currentUser") || "null", null);
}

if (currentUser && currentUser.role !== "guest" && currentUser.status === "disabled") {
  window.Auth?.logout?.();
  localStorage.removeItem("currentUser");
  alert("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
  window.location.href = "../login&register/Login/login.html";
}

function showToast(message) {
  const toastBody = document.getElementById("cartToastBody");
  if (toastBody) {
    toastBody.textContent = message;
  }
  const toastEl = document.getElementById("cartToast");
  if (toastEl) {
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
  }
}

window.showToast = showToast;

$(document).ready(function () {
  const $searchInput = $("#mainSearchInput");
  const $clearSearchBtn = $("#clearSearchBtn");
  const $flowerTags = $(".flower-tag");

  function applyTheme(theme) {
    const html = document.documentElement;
    const icon = document.getElementById("themeIcon");
    const isDark = theme === "dark";

    html.classList.toggle("dark", isDark);
    html.classList.toggle("light", !isDark);
    if (icon) {
      icon.classList.toggle("bx-sun", !isDark);
      icon.classList.toggle("bx-moon", isDark);
    }
  }

  function initThemeToggle() {
    const darkToggle = document.getElementById("darkToggle");
    const savedTheme = localStorage.getItem("flowershop-theme");
    applyTheme(savedTheme === "dark" ? "dark" : "light");

    if (darkToggle) {
      darkToggle.addEventListener("click", function () {
        const isDark = document.documentElement.classList.contains("dark");
        const nextTheme = isDark ? "light" : "dark";
        localStorage.setItem("flowershop-theme", nextTheme);
        applyTheme(nextTheme);
      });
    }
  }

  function annotateProductCards($cards) {
    $cards.each(function (index) {
      const $card = $(this);
      const sectionId = $card.closest("section").attr("id") || "";
      const flowerType = FLOWER_TYPE_BY_SECTION[sectionId] || "khac";
      const priceValue = parsePriceToNumber($card.find(".price-text").first().text());

      const existingStatus = String($card.attr("data-stock-status") || "").trim();
      const stockStatus = existingStatus || inferStockStatusByPrice(priceValue + index * 0);

      $card.attr("data-flower-type", flowerType);
      $card.attr("data-price", priceValue);
      $card.attr("data-stock-status", stockStatus);

      let $badge = $card.find(".stock-status-badge").first();
      if (!$badge.length) {
        const badgeClass = stockStatus === "out_of_stock" ? "out_of_stock" : "available";
        const badgeText = stockStatus === "out_of_stock" ? "Hết hàng" : "Còn hàng";
        $badge = $(
          `<span class="stock-status-badge ${badgeClass}"><i class='bx bx-package'></i>${badgeText}</span>`,
        );
        const $title = $card.find("h5").first();
        if ($title.length) {
          $title.after($badge);
        }
      }

      const outOfStock = stockStatus === "out_of_stock";
      const $addBtn = $card.find(".btn-cart-pink").first();
      $card.toggleClass("is-out-of-stock", outOfStock);
      if ($addBtn.length) {
        $addBtn.prop("disabled", outOfStock);
        $addBtn.attr("title", outOfStock ? "Sản phẩm tạm hết hàng" : "Thêm vào giỏ");
      }
    });
  }

  function applyProductFilters() {
    const query = $searchInput.val().toLowerCase().trim();
    const minPriceRaw = $("#minPriceFilter").val();
    const maxPriceRaw = $("#maxPriceFilter").val();
    const typeFilter = $("#flowerTypeFilter").val() || "all";
    const statusFilter = $("#stockStatusFilter").val() || "all";

    const minPrice = minPriceRaw ? Number(minPriceRaw) : null;
    const maxPrice = maxPriceRaw ? Number(maxPriceRaw) : null;
    const filterActive = isFilterActive(query, minPrice, maxPrice, typeFilter, statusFilter);

    $("section .more-flowers").toggleClass("d-none", !filterActive);
    $(".xem-them-btn").toggle(!filterActive);

    $("section[id]").each(function () {
      const $section = $(this);
      let visibleCount = 0;

      $section.find(".product-card").each(function () {
        const $card = $(this);
        const $container = $card.closest("[class*='col-']");

        const title = ($card.find("h5").text() || "").toLowerCase();
        const desc = ($card.find("p").first().text() || "").toLowerCase();
        const price = Number($card.attr("data-price") || 0);
        const flowerType = String($card.attr("data-flower-type") || "");
        const stockStatus = String($card.attr("data-stock-status") || "available");

        const matchesQuery = !query || title.includes(query) || desc.includes(query);
        const matchesMin = minPrice === null || price >= minPrice;
        const matchesMax = maxPrice === null || price <= maxPrice;
        const matchesType = typeFilter === "all" || flowerType === typeFilter;
        const matchesStatus = statusFilter === "all" || stockStatus === statusFilter;

        const visible = matchesQuery && matchesMin && matchesMax && matchesType && matchesStatus;
        $container.toggle(visible);
        if (visible) visibleCount += 1;
      });

      $section.toggle(visibleCount > 0);
    });
  }

  function initFilterPopover() {
    const toggleBtn = document.getElementById("filterToggleBtn");
    const panel = document.getElementById("filterPopoverPanel");
    const applyBtn = document.getElementById("applyFilterBtn");
    const resetBtn = document.getElementById("resetFilterBtn");

    if (!toggleBtn || !panel) return;

    const closePanel = () => {
      panel.classList.add("d-none");
      toggleBtn.setAttribute("aria-expanded", "false");
    };

    const openPanel = () => {
      panel.classList.remove("d-none");
      toggleBtn.setAttribute("aria-expanded", "true");
    };

    toggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (panel.classList.contains("d-none")) {
        openPanel();
      } else {
        closePanel();
      }
    });

    document.addEventListener("click", function (e) {
      if (!panel.classList.contains("d-none") && !panel.contains(e.target) && !toggleBtn.contains(e.target)) {
        closePanel();
      }
    });

    applyBtn?.addEventListener("click", function () {
      applyProductFilters();
      closePanel();
    });

    resetBtn?.addEventListener("click", function () {
      $("#minPriceFilter").val("");
      $("#maxPriceFilter").val("");
      $("#flowerTypeFilter").val("all");
      $("#stockStatusFilter").val("all");
      applyProductFilters();
    });
  }

  function initUserUI() {
    const adminBtn = document.getElementById("adminBtn");
    if (adminBtn) {
      if (currentUser && currentUser.role === "admin") {
        adminBtn.classList.remove("d-none");
        adminBtn.classList.add("d-flex");
      } else {
        adminBtn.classList.add("d-none");
        adminBtn.classList.remove("d-flex");
      }
    }

    const userAvatarImg = document.getElementById("userAvatarImg");
    const userGreetingName = document.getElementById("userGreetingName");

    if (currentUser) {
      if (userAvatarImg) {
        const isValidSrc = (s) => s && (s.startsWith("data:") || s.startsWith("http"));
        const src = isValidSrc(currentUser.avatar)
          ? currentUser.avatar
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "User")}&background=3b82f6&color=fff`;
        userAvatarImg.src = src;
      }
      if (userGreetingName) {
        userGreetingName.textContent = `Xin chào, ${currentUser.name}!`;
      }
    } else {
      if (userAvatarImg) {
        userAvatarImg.src = "https://ui-avatars.com/api/?name=Guest&background=9ca3af&color=fff";
      }
      if (userGreetingName) {
        userGreetingName.textContent = "Xin chào, Khách!";
      }
    }

    const btnLogout = document.getElementById("btnLogout");
    const changeAvatarLink = document.querySelector('[data-bs-target="#changeAvatarModal"]');
    if (btnLogout) {
      if (currentUser) {
        btnLogout.style.display = "";
      } else {
        btnLogout.style.display = "none";
      }

      btnLogout.addEventListener("click", function (e) {
        e.preventDefault();
        if (currentUser && currentUser.role === "guest") {
          localStorage.removeItem("currentUser");
          window.Auth?.logout?.();
        } else if (window.Auth) {
          window.Auth.logout();
        } else {
          localStorage.removeItem("currentUser");
        }
        window.location.href = "../login&register/Login/login.html";
      });
    }

    if (changeAvatarLink && currentUser && currentUser.role === "guest") {
      changeAvatarLink.parentElement.style.display = "none";
    }
  }

  function initCommonInteractions() {
    $(".nav-link-internal").on("click", function (e) {
      if (this.hash !== "") {
        e.preventDefault();
        const hash = this.hash;
        $("html, body").animate(
          {
            scrollTop: $(hash).offset().top - 80,
          },
          800,
        );
      }
    });

    $(document).on("mousedown", "button, .btn, .cat-pill", function (e) {
      const $el = $(this);
      const $ripple = $('<span class="ripple"></span>');
      const offset = $el.offset();
      const x = e.pageX - offset.left;
      const y = e.pageY - offset.top;
      $ripple.css({ top: y, left: x });
      $el.append($ripple);
      setTimeout(() => $ripple.remove(), 600);
    });

    const $backToTop = $("#backToTopBtn");
    const toggleBackToTop = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (scrollTop > 300) {
        $backToTop.addClass("show");
      } else {
        $backToTop.removeClass("show");
      }
    };

    $(window).on("scroll", toggleBackToTop);
    toggleBackToTop();

    $backToTop.on("click", function (e) {
      e.preventDefault();
      $("html, body").animate({ scrollTop: 0 }, 600, "swing");
    });
  }

  function initSearchAndTagEvents() {
    $searchInput.off("input");
    $clearSearchBtn.off("click");
    $flowerTags.off("click");

    $searchInput.on("input", applyProductFilters);

    $clearSearchBtn.on("click", function () {
      $searchInput.val("");
      applyProductFilters();
    });

    $flowerTags.on("click", function (e) {
      e.preventDefault();
      const tagText = $(this).text().trim();
      $searchInput.val(tagText);
      applyProductFilters();
    });

    $("#minPriceFilter, #maxPriceFilter, #flowerTypeFilter, #stockStatusFilter").on("change", applyProductFilters);
  }

  // Dữ liệu mẫu để tạo hoa ngẫu nhiên
  const flowerData = {
    images: ["chia_buon_1.png", "chia_buon_2.png", "gio_hoa_1.png", "ke_hoa_1.png", "sinh_nhat_1.png", "hoa_cuoi_1.png", "dao_tet.png", "lan_ho_diep.png"],
    adjectives: ["Rực Rỡ", "Sang Trọng", "Hạnh Phúc", "Tinh Khôi", "Bình Yên", "Thịnh Vượng", "Nồng Nàn", "Ngọt Ngào"],
    types: ["Lẵng Hoa", "Bó Hoa", "Kệ Hoa", "Bình Hoa", "Giỏ Hoa", "Hộp Hoa"],
    prices: ["450.000đ", "600.000đ", "850.000đ", "1.200.000đ", "1.500.000đ", "2.000.000đ", "3.500.000đ", "700.000đ"],
  };

  const generateRandomFlowerHTML = () => {
    const randomImg = flowerData.images[Math.floor(Math.random() * flowerData.images.length)];
    const randomName = `${flowerData.types[Math.floor(Math.random() * flowerData.types.length)]} ${flowerData.adjectives[Math.floor(Math.random() * flowerData.adjectives.length)]}`;
    const randomDesc = flowerData.adjectives[Math.floor(Math.random() * flowerData.adjectives.length)];
    const randomPrice = flowerData.prices[Math.floor(Math.random() * flowerData.prices.length)];
    const randomHue = Math.floor(Math.random() * 360);

    return `
      <div class="col-md-6 col-lg-3 dynamic-flower" style="display: none;">
        <div class="card product-card">
          <div class="card-img-container"><img src="../Photo/${randomImg}" style="filter: hue-rotate(${randomHue}deg);" alt="${randomName}"></div>
          <div class="card-body p-4">
            <h5 class="fw-bold mb-1">${randomName}</h5>
            <p class="text-muted small mb-3">Lựa chọn ${randomDesc.toLowerCase()}</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="price-text">${randomPrice}</span>
              <button class="btn-cart-pink"><i class='bx bx-plus'></i></button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  $(".xem-them-btn").off("click");
  $(document).off("click", ".xem-them-btn");
  $(document).on("click", ".xem-them-btn", function (e) {
    e.preventDefault();
    const $btn = $(this);
    const $section = $btn.closest("section");
    const $row = $section.find(".row.g-4").first();
    let $dynamicFlowers = $section.find(".dynamic-flower");

    if ($dynamicFlowers.length === 0) {
      $section.find(".more-flowers").remove();

      let newHtml = "";
      for (let i = 0; i < 4; i += 1) {
        newHtml += generateRandomFlowerHTML();
      }

      const $newElements = $(newHtml);
      $row.append($newElements);
      annotateProductCards($newElements.find(".product-card"));
      $newElements.fadeIn();
      applyProductFilters();
      $btn.html('Thu gọn <i class="bx bx-chevron-up"></i>');
    } else {
      $dynamicFlowers.fadeToggle(300, function () {
        applyProductFilters();
      });

      if ($btn.text().trim() === "Xem thêm") {
        $btn.html('Thu gọn <i class="bx bx-chevron-up"></i>');
      } else {
        $btn.html('Xem thêm <i class="bx bx-chevron-down"></i>');
      }
    }
  });

  initThemeToggle();
  initUserUI();
  initCommonInteractions();
  annotateProductCards($(".product-card"));
  initFilterPopover();
  initSearchAndTagEvents();
  applyProductFilters();
});

const userDropdown = document.querySelector(".dropdown");
if (userDropdown) {
  userDropdown.addEventListener("shown.bs.dropdown", function () {
    userDropdown.classList.add("active");
  });

  userDropdown.addEventListener("hidden.bs.dropdown", function () {
    userDropdown.classList.remove("active");
  });
}

 