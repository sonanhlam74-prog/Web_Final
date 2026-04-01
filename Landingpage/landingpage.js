$(function () {
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
