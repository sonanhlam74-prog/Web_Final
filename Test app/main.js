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

  // Dữ liệu mẫu để tạo hoa ngẫu nhiên
  const flowerData = {
    images: ['chia_buon_1.png', 'chia_buon_2.png', 'gio_hoa_1.png', 'ke_hoa_1.png', 'sinh_nhat_1.png', 'hoa_cuoi_1.png', 'dao_tet.png', 'lan_ho_diep.png'],
    adjectives: ['Rực Rỡ', 'Sang Trọng', 'Hạnh Phúc', 'Tinh Khôi', 'Bình Yên', 'Thịnh Vượng', 'Nồng Nàn', 'Ngọt Ngào'],
    types: ['Lẵng Hoa', 'Bó Hoa', 'Kệ Hoa', 'Bình Hoa', 'Giỏ Hoa', 'Hộp Hoa'],
    prices: ['450.000đ', '600.000đ', '850.000đ', '1.200.000đ', '1.500.000đ', '2.000.000đ', '3.500.000đ', '700.000đ']
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

  // Xem thêm logic - dùng sự kiện ủy quyền (Event Delegation) để đảm bảo luôn bắt được click
  $(document).on('click', '.xem-them-btn', function(e) {
    e.preventDefault();
    const $btn = $(this);
    const $section = $btn.closest('section');
    const $row = $section.find('.row.g-4').first(); // Lấy hàng chứa hoa đầu tiên

    let $dynamicFlowers = $section.find('.dynamic-flower');
    
    if ($dynamicFlowers.length === 0) {
      // Loại bỏ khối tĩnh bị dư thừa nếu có
      $section.find('.more-flowers').remove();

      // Chưa có hoa thêm, tạo mới 4 bông ngẫu nhiên
      let newHtml = '';
      for(let i=0; i<4; i++) {
        newHtml += generateRandomFlowerHTML();
      }
      const $newElements = $(newHtml);
      $row.append($newElements);
      $newElements.fadeIn();
      $btn.html('Thu gọn <i class="bx bx-chevron-up"></i>');
    } else {
      // Nếu đã có thì toggle fade để không lỗi flexbox
      $dynamicFlowers.fadeToggle(300);
      // Đổi text ngay lập tức cho mượt
      if ($btn.text().trim() === 'Xem thêm') {
        $btn.html('Thu gọn <i class="bx bx-chevron-up"></i>');
      } else {
        $btn.html('Xem thêm <i class="bx bx-chevron-down"></i>');
      }
    }
  });
});

function showToast(message) {
  const toastBody = document.getElementById('cartToastBody');
  if (toastBody) {
    toastBody.textContent = message;
  }
  const toastEl = document.getElementById('cartToast');
  if (toastEl) {
    const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
    toast.show();
  }
}

window.showToast = showToast;

const userDropdown = document.querySelector('.dropdown');
if (userDropdown) {
  userDropdown.addEventListener('shown.bs.dropdown', function () {
    userDropdown.classList.add('active');
  });

  userDropdown.addEventListener('hidden.bs.dropdown', function () {
    userDropdown.classList.remove('active');
  });
}