$(function () {
  // ===== LOAD CURRENT USER AND CHECK ADMIN =====
  if (window.Auth) {
    window.Auth.getCurrentUser();
  }
  
  let currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser && window.Auth && window.Auth.getCurrentUser && window.Auth.getCurrentUser()) {
    const authUser = window.Auth.getCurrentUser();
    currentUser = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.displayName || authUser.email.split('@')[0],
      username: authUser.email,
      displayName: authUser.displayName,
      avatar: authUser.avatar || 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff',
      role: authUser.email.startsWith("admin") ? "admin" : "user",
      accumulatedSpend: 0
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
  }
  
  // Show admin link only for admins
  const adminLink = document.querySelector('.admin-link');
  if (adminLink) {
    if (currentUser && currentUser.role === 'admin') {
      adminLink.classList.remove('d-none');
      adminLink.classList.add('d-md-inline-flex');
    } else {
      adminLink.classList.add('d-none');
      adminLink.classList.remove('d-md-inline-flex');
    }
  }

  // ===== DARK MODE (jQuery) =====
  var $html = $("html");
  var $toggle = $("#dark-toggle");
  var $themeIcon = $("#theme-icon");

  // Restore saved theme
  var savedTheme = localStorage.getItem("flowershop-theme");
  if (savedTheme === "dark") {
    $html.removeClass("light").addClass("dark");
    $themeIcon.text("dark_mode");
  }

  // Toggle on click
  $toggle.on("click", function () {
    $html.toggleClass("dark light");
    var isDark = $html.hasClass("dark");
    localStorage.setItem("flowershop-theme", isDark ? "dark" : "light");
    $themeIcon.text(isDark ? "dark_mode" : "light_mode");
  });

  // ===== SCROLL ANIMATIONS (jQuery + IntersectionObserver) =====
  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        $.each(entries, function (_, entry) {
          if (entry.isIntersecting) {
            $(entry.target).addClass("visible");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    $(".fade-up").each(function () {
      observer.observe(this);
    });
  } else {
    // Fallback for older browsers
    $(".fade-up").addClass("visible");
  }

  // ===== SMOOTH SCROLL for anchor links (jQuery) =====
  $('a[href^="#"]').on("click", function (e) {
    var target = $($(this).attr("href"));
    if (target.length) {
      e.preventDefault();
      $("html, body").animate(
        {
          scrollTop: target.offset().top - 80,
        },
        600,
      );

      // Close mobile navbar if open
      var $navCollapse = $("#navbarContent");
      if ($navCollapse.hasClass("show")) {
        bootstrap.Collapse.getInstance($navCollapse[0]).hide();
      }
    }
  });

  // ===== NAVBAR SCROLL SHADOW (jQuery) =====
  $(window).on("scroll", function () {
    var $navbar = $("#main-navbar");
    if ($(this).scrollTop() > 10) {
      $navbar.css("box-shadow", "0 4px 30px rgba(0,0,0,0.06)");
    } else {
      $navbar.css("box-shadow", "none");
    }
  });
});
const $backToTop = $("#backToTopBtn");
$(window).scroll(function () {
  if ($(this).scrollTop() > 300) {
    $backToTop.addClass("show");
  } else {
    $backToTop.removeClass("show");
  }
});
