$(document).ready(function() {
    // Require login for this page
    if (window.Auth) {
        window.Auth.requireLogin({ redirectTo: '../login&register/Login/login_site.html' });
    }

    // Category Navigation and Active State (jQuery)
    $('.cat-btn').on('click', function() {
        const $btn = $(this);
        
        // Toggle active state
        $('.cat-btn').removeClass('active');
        $btn.addClass('active');

        // Scroll to section
        const text = $btn.find('span').text().trim().toLowerCase();
        let targetId = '';
        if (text.includes('tết')) targetId = 'hoa-tet';
        else if (text.includes('chia buồn')) targetId = 'hoa-chia-buon';
        else if (text.includes('cưới')) targetId = 'hoa-cuoi';

        if (targetId) {
            const $target = $('#' + targetId);
            if ($target.length) {
                $('html, body').animate({
                    scrollTop: $target.offset().top - 100
                }, 600);
            }
        }
        
        // Button click feedback animation
        $btn.addClass('btn-pulse');
        setTimeout(() => $btn.removeClass('btn-pulse'), 300);
    });

    // Add to cart click feedback
    $('.add-to-cart-btn, .btn-primary, .btn, button').on('click', function(e) {
        const $btn = $(this);
        
        // Ripple effect
        const x = e.pageX - $btn.offset().left;
        const y = e.pageY - $btn.offset().top;
        
        const $ripple = $('<span class="ripple"></span>');
        $ripple.css({
            left: x + 'px',
            top: y + 'px'
        });
        
        $btn.append($ripple);
        
        setTimeout(() => {
            $ripple.remove();
        }, 600);

        $btn.addClass('btn-clicked');
        setTimeout(() => $btn.removeClass('btn-clicked'), 400);
        
        // Optional: show a small toast or notification
        if ($btn.hasClass('add-to-cart-btn')) {
            console.log('Added to cart!');
        }
    });
});
