$(document).ready(function () {
  $('.nav-link-internal').on('click', function (e) {
    if (this.hash !== "") {
      e.preventDefault();
      const hash = this.hash;
      $('html, body').animate({
        scrollTop: $(hash).offset().top - 80
      }, 800);
    }
  });

  $(document).on('mousedown', 'button, .btn, .cat-pill', function (e) {
    const $el = $(this);
    const $ripple = $('<span class="ripple"></span>');
    const offset = $el.offset();
    const x = e.pageX - offset.left;
    const y = e.pageY - offset.top;
    $ripple.css({ top: y, left: x });
    $el.append($ripple);
    setTimeout(() => $ripple.remove(), 600);
  });

  // Back to top logic
  const $backToTop = $('#backToTopBtn');
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $backToTop.addClass('show');
    } else {
      $backToTop.removeClass('show');
    }
  });

  $backToTop.click(function (e) {
    e.preventDefault();
    $('html, body').animate({ scrollTop: 0 }, 600, 'swing');
  });
});
