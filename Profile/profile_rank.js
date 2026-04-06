// 0. Ensure Auth is loaded and currentUser is migrated
if (window.Auth) {
    window.Auth.getCurrentUser(); // This will trigger migration if needed
}

// 1. Auth check - Allow both authenticated and guest users
let currentUser = JSON.parse(localStorage.getItem('currentUser'));

// If still no currentUser but we have Auth session, force migration
if (!currentUser && window.Auth && window.Auth.getCurrentUser && window.Auth.getCurrentUser()) {
    // Manually create currentUser from Auth session
    const authUser = window.Auth.getCurrentUser();
    const DEFAULT_AVATAR = "../Photo/person.png";
    currentUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.displayName || authUser.email.split('@')[0],
        username: authUser.email,
        displayName: authUser.displayName,
        avatar: authUser.avatar || DEFAULT_AVATAR,
        role: authUser.role || (authUser.email.startsWith("admin") ? "admin" : "user"),
        status: authUser.status || 'active',
        accumulatedSpend: 0
    };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
}

// If no user at all, create a guest user
if (!currentUser) {
    currentUser = {
        id: 'guest_' + Date.now(),
        email: 'guest@example.com',
        name: 'Khách',
        username: 'guest',
        displayName: 'Khách',
        avatar: 'https://ui-avatars.com/api/?name=Guest&background=9ca3af&color=fff',
        role: 'guest',
        accumulatedSpend: 0
    };
}

function calculateRank(spend) {
    if (spend < 500000) return { name: 'Đồng', currentLimit: 0, nextLimit: 500000, nextName: 'Bạc', icon: 'https://pathfinder.w3schools.com/images/leagues/bronze.svg' };
    if (spend < 2000000) return { name: 'Bạc', currentLimit: 500000, nextLimit: 2000000, nextName: 'Vàng', icon: 'https://pathfinder.w3schools.com/images/leagues/silver.svg' };
    if (spend < 5000000) return { name: 'Vàng', currentLimit: 2000000, nextLimit: 5000000, nextName: 'Bạch Kim', icon: 'https://pathfinder.w3schools.com/images/leagues/gold.svg' };
    return { name: 'Bạch Kim', currentLimit: 5000000, nextLimit: null, nextName: null, icon: 'https://pathfinder.w3schools.com/images/leagues/platinum.svg' };
}

function getDiscountCodes(rankName) {
    const codes = [
        { code: 'FREESHIP', desc: 'Miễn phí vận chuyển toàn quốc' }
    ];
    
    if (['Đồng', 'Bạc', 'Vàng', 'Bạch Kim'].includes(rankName)) {
        codes.push({ code: 'HOA5K', desc: 'Giảm 5K cho mọi đơn hàng hoa' });
    }
    
    if (['Bạc', 'Vàng', 'Bạch Kim'].includes(rankName)) {
        codes.push({ code: 'GIAM10K', desc: 'Giảm 10K cho đơn > 200K' });
        codes.push({ code: 'TANGTHIEP', desc: 'Tặng thiệp viết tay miễn phí' });
    }
    
    if (['Vàng', 'Bạch Kim'].includes(rankName)) {
        codes.push({ code: 'GIAM50K', desc: 'Giảm 50K cho đơn > 500K' });
        codes.push({ code: 'MUA1TANG1', desc: 'Mua 1 bó lớn tặng 1 cành hoa hồng' });
    }
    
    if (rankName === 'Bạch Kim') {
        codes.push({ code: 'GIAM100K', desc: 'Giảm 100K cho đơn > 1 Triệu' });
        codes.push({ code: 'VIPCARE', desc: 'Giao hàng hỏa tốc trong 1h miễn phí' });
        codes.push({ code: 'HOANTIEN20', desc: 'Hoàn tiền 20% xu vào ví' });
    }
    return codes;
}

$(document).ready(function () {
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
        
        // Display role appropriately
        let roleText = 'Người dùng';
        if (currentUser.role === 'admin') {
            roleText = 'Quản trị viên';
        } else if (currentUser.role === 'staff') {
            roleText = 'Nhân viên';
        } else if (currentUser.role === 'guest') {
            roleText = 'Khách';
        }
        $('#profileRole').text(roleText);

        $('#cardRankIcon').attr('src', rankInfo.icon);
        $('#cardRankName').text(rankInfo.name);
        $('#accumulatedSpendText').text(spend.toLocaleString('vi-VN') + 'đ');

        if (rankInfo.nextLimit) {
            const needed = rankInfo.nextLimit - spend;
            $('#nextRankText').text(`Cần ${needed.toLocaleString('vi-VN')}đ để lên hạng ${rankInfo.nextName}`);
            
            // Tính % tương đối giữa khoảng cách của hạng hiện tại và hạng tiếp theo
            const currentLevelSpan = rankInfo.nextLimit - rankInfo.currentLimit;
            const spendInCurrentLevel = spend - rankInfo.currentLimit;
            const percent = (spendInCurrentLevel / currentLevelSpan) * 100;
            
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
    $('#btnLogout').on('click', function (e) {
        e.preventDefault();
        if (currentUser.role === 'guest') {
            // Guest users switch to login
            localStorage.removeItem('currentUser');
            if (window.Auth?.logout) {
                window.Auth.logout();
            }
            window.location.href = '../login&register/Login/login.html';
        } else {
            if (window.Auth) {
                window.Auth.logout();
            } else {
                localStorage.removeItem('currentUser');
            }
            window.location.href = '../login&register/Login/login.html';
        }
    });

    // 4. Change Avatar (only for logged-in users)
    if (currentUser.role !== 'guest') {
        $('#changeAvatarForm').on('submit', function (e) {
            e.preventDefault();
            const fileInput = $('#newAvatarFile')[0];
            if (fileInput && fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const base64Image = e.target.result;
                    
                    // Update using Auth if available
                    if (window.Auth && window.Auth.setCurrentUserAvatar) {
                        window.Auth.setCurrentUserAvatar(base64Image);
                    }
                    
                    // Also update localStorage for backward compatibility
                    currentUser.avatar = base64Image;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    $('#userAvatarImg, #profileAvatar').attr('src', base64Image);
                    $('#changeAvatarModal').modal('hide');
                    fileInput.value = '';
                };
                reader.readAsDataURL(fileInput.files[0]);
            }
        });
    } else {
        // Hide avatar change button for guest users
        $('[data-bs-target="#changeAvatarModal"]').hide();
    }

    // 5. "Xem thêm" Expand/Collapse Logic (test.html)
    $('.xem-them-btn').on('click', function (e) {
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
        $searchInput.on('input', function () {
            const query = $(this).val().toLowerCase().trim();
            if (query) {
                $('section').each(function () {
                    let hasVisible = false;
                    const $section = $(this);

                    $section.find('.more-flowers').removeClass('d-none');
                    $section.find('.xem-them-btn').hide();

                    $section.find('.product-card').each(function () {
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

        $clearBtn.on('click', function () {
            $searchInput.val('');
            resetSearch();
        });

        // 7. Click on Tag Suggestions
        $('.flower-tag').on('click', function (e) {
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
