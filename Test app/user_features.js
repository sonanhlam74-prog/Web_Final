// 1. Auth check
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'login.html';
}

function calculateRank(spend) {
    if (spend < 500000) return { name: 'Đồng', nextLimit: 500000, nextName: 'Bạc', icon: 'https://img.icons8.com/color/48/pot.png' };
    if (spend < 2000000) return { name: 'Bạc', nextLimit: 2000000, nextName: 'Vàng', icon: 'https://img.icons8.com/color/48/silver-medal.png' };
    if (spend < 5000000) return { name: 'Vàng', nextLimit: 5000000, nextName: 'Bạch Kim', icon: 'https://img.icons8.com/color/48/gold-medal.png' };
    return { name: 'Bạch Kim', nextLimit: null, nextName: null, icon: 'https://img.icons8.com/color/48/diamond--v1.png' };
}

function getDiscountCodes(rankName) {
    const codes = [
        { code: 'FREESHIP', desc: 'Miễn phí vận chuyển toàn quốc' }
    ];
    if (['Bạc', 'Vàng', 'Bạch Kim'].includes(rankName)) {
        codes.push({ code: 'GIAM10K', desc: 'Giảm 10K cho đơn > 200K' });
    }
    if (['Vàng', 'Bạch Kim'].includes(rankName)) {
        codes.push({ code: 'GIAM50K', desc: 'Giảm 50K cho đơn > 500K' });
    }
    if (rankName === 'Bạch Kim') {
        codes.push({ code: 'GIAM100K', desc: 'Giảm 100K cho đơn > 1 Triệu' });
    }
    return codes;
}

$(document).ready(function() {
    const spend = currentUser.accumulatedSpend || 0;
    const rankInfo = calculateRank(spend);

    // 2. Setup UI based on role and rank context
    if (currentUser.role !== 'admin') {
        $('#adminBtn').addClass('d-none').removeClass('d-flex');
    } else {
        $('#adminBtn').removeClass('d-none').addClass('d-flex');
    }

    // Avatar and Greeting
    $('#userAvatarImg, #profileAvatar').attr('src', currentUser.avatar);
    $('#userGreetingName').text('Xin chào, ' + currentUser.name + '!');

    // Rank Badge in Header
    $('#headerRankIcon').attr('src', rankInfo.icon);
    $('#headerRankName').text(rankInfo.name);

    // Yellow Info Bar formatting (for test.html)
    if ($('.yellow-info-bar').length) {
        if (rankInfo.nextLimit) {
            const needed = rankInfo.nextLimit - spend;
            $('.yellow-info-bar').html(`Tích lũy: ${spend.toLocaleString('vi-VN')}đ — Còn ${needed.toLocaleString('vi-VN')}đ để lên hạng ${rankInfo.nextName}`);
        } else {
            $('.yellow-info-bar').html(`Tích lũy: ${spend.toLocaleString('vi-VN')}đ — Bạn đang ở hạng cao nhất!`);
        }
    }

    // Profile Page Population
    if ($('#profileName').length) {
        $('#profileName').text(currentUser.name);
        $('#profileUsername').text(currentUser.username);
        $('#profileRole').text(currentUser.role === 'admin' ? 'Quản trị viên' : 'Người dùng');
        
        $('#cardRankIcon').attr('src', rankInfo.icon);
        $('#cardRankName').text(rankInfo.name);
        $('#accumulatedSpendText').text(spend.toLocaleString('vi-VN') + 'đ');
        
        if (rankInfo.nextLimit) {
            const needed = rankInfo.nextLimit - spend;
            $('#nextRankText').text(`Cần ${needed.toLocaleString('vi-VN')}đ để lên hạng ${rankInfo.nextName}`);
            const percent = (spend / rankInfo.nextLimit) * 100;
            $('#rankProgressBar').css('width', `${percent}%`);
        } else {
            $('#nextRankText').text('Đạt hạng tối đa');
            $('#rankProgressBar').css('width', '100%').removeClass('bg-primary').addClass('bg-warning');
        }

        const codes = getDiscountCodes(rankInfo.name);
        const codesHtml = codes.map(c => `
            <div class="discount-card">
              <div>
                <p class="mb-0 fw-semibold text-dark">${c.desc}</p>
                <small class="text-muted">Áp dụng cho hạng ${rankInfo.name} trở lên</small>
              </div>
              <div class="discount-code">${c.code}</div>
            </div>
        `).join('');
        $('#discountCodesList').html(codesHtml);
    }

    // 3. Logout
    $('#btnLogout').on('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // 4. Change Avatar
    $('#changeAvatarForm').on('submit', function(e) {
        e.preventDefault();
        const fileInput = $('#newAvatarFile')[0];
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const base64Image = e.target.result;
                currentUser.avatar = base64Image;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                $('#userAvatarImg, #profileAvatar').attr('src', base64Image);
                $('#changeAvatarModal').modal('hide');
                fileInput.value = '';
            };
            reader.readAsDataURL(fileInput.files[0]);
        }
    });

    // 5. "Xem thêm" Expand/Collapse Logic (test.html)
    $('.xem-them-btn').on('click', function(e) {
        e.preventDefault();
        const $btn = $(this);
        const $section = $btn.closest('section');
        const $moreFlowers = $section.find('.more-flowers');
        
        if ($moreFlowers.hasClass('d-none')) {
            $moreFlowers.removeClass('d-none');
            $btn.html(`Thu gọn <i class='bx bx-up-arrow-alt'></i>`);
        } else {
            $moreFlowers.addClass('d-none');
            $btn.html(`Xem thêm <i class='bx bx-right-arrow-alt'></i>`);
        }
    });

    // 6. Search Functionality
    const $searchInput = $('#mainSearchInput');
    const $clearBtn = $('#clearSearchBtn');
    
    if ($searchInput.length) {
        $searchInput.on('input', function() {
            const query = $(this).val().toLowerCase().trim();
            if (query) {
                $('section').each(function() {
                    let hasVisible = false;
                    const $section = $(this);
                    
                    $section.find('.more-flowers').removeClass('d-none');
                    $section.find('.xem-them-btn').hide();
                    
                    $section.find('.product-card').each(function() {
                        const $card = $(this);
                        const title = $card.find('h5').text().toLowerCase();
                        if (title.includes(query)) {
                            $card.closest('[class*="col-"]').show();
                            hasVisible = true;
                        } else {
                            $card.closest('[class*="col-"]').hide();
                        }
                    });

                    if (hasVisible) {
                        $section.show();
                    } else {
                        $section.hide();
                    }
                });
            } else {
                resetSearch();
            }
        });

        $clearBtn.on('click', function() {
            $searchInput.val('');
            resetSearch();
        });

        // 7. Click on Tag Suggestions
        $('.flower-tag').on('click', function(e) {
            e.preventDefault();
            const tagText = $(this).text().trim();
            $searchInput.val(tagText);
            $searchInput.trigger('input');
        });

        function resetSearch() {
            $('section').show();
            $('section [class*="col-"]').show();
            $('section .more-flowers').addClass('d-none');
            $('.xem-them-btn').show().html(`Xem thêm <i class='bx bx-right-arrow-alt'></i>`);
        }
    }
});
