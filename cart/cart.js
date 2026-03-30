// ==========================================
// cart.js - Shopping Cart Logic (LocalStorage)
// ==========================================

const CART_KEY = 'flowershop_cart';

const CartService = {
    getCart() {
        try {
            return JSON.parse(localStorage.getItem(CART_KEY)) || [];
        } catch {
            return [];
        }
    },
    saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        this.updateBadge();
    },
    addItem(product) {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        this.saveCart(cart);
        
        // Show lightweight feedback (could use Bootstrap toast)
        if (typeof showToast === 'function') {
            showToast('Đã thêm ' + product.name + ' vào giỏ hàng!');
        } else {
            console.log('Added to cart:', product.name);
            // Quick visual feedback on cart icon
            const badge = document.getElementById('cart-badge');
            if (badge) {
                badge.parentElement.style.transform = 'scale(1.2)';
                setTimeout(() => badge.parentElement.style.transform = 'scale(1)', 200);
            }
        }
    },
    updateQuantity(id, delta) {
        let cart = this.getCart();
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            this.saveCart(cart);
        }
    },
    removeItem(id) {
        let cart = this.getCart();
        cart = cart.filter(i => i.id !== id);
        this.saveCart(cart);
    },
    clearCart() {
        localStorage.removeItem(CART_KEY);
        this.updateBadge();
    },
    updateBadge() {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const badge = document.getElementById('cart-badge');
        if (badge) {
            badge.textContent = totalItems;
            if (totalItems > 0) {
                badge.classList.remove('d-none');
            } else {
                badge.classList.add('d-none');
            }
        }
    },
    parsePrice(priceStr) {
        return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
    },
    formatPrice(num) {
        return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
    }
};

// ==========================================
// Initialization & Event Listeners
// ==========================================

$(document).ready(function() {
    // 1. Initialize Badge
    CartService.updateBadge();

    // 2. Add to Cart Logic (for test.html)
    $('.btn-cart-pink').on('click', function(e) {
        e.preventDefault();
        
        // Traverse DOM to find product details
        const $card = $(this).closest('.product-card');
        const name = $card.find('h5').text().trim();
        const price = $card.find('.price-text').text().trim();
        const imgSrc = $card.find('.card-img-container img').attr('src');
        
        // Generate a pseudo-ID based on name since we don't have DB IDs
        const id = 'prod_' + btoa(encodeURIComponent(name)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
        
        CartService.addItem({
            id: id,
            name: name,
            price: price,
            image: imgSrc
        });
    });

    // 3. Render Checkout Cart (for checkout.html)
    function renderCheckoutCart() {
        const $container = $('#checkout-cart-items');
        if ($container.length === 0) return; // Not on checkout page

        const cart = CartService.getCart();
        const $emptyState = $('#empty-cart-state');
        
        if (cart.length === 0) {
            $container.html($emptyState[0].outerHTML); // Keep empty state
            $('#summary-subtotal').text('0 VND');
            $('#summary-tax').text('0 VND');
            $('#summary-shipping').text('0 VND');
            $('#summary-total').text('0 VND');
            return;
        }

        let html = '';
        let subtotal = 0;

        cart.forEach(item => {
            const itemPrice = CartService.parsePrice(item.price);
            subtotal += itemPrice * item.quantity;
            
            html += `
                <div class="d-flex align-items-center mb-3 pb-3 border-bottom cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #eee;">
                    <div class="ms-3 flex-grow-1">
                        <h6 class="mb-1 text-dark" style="font-size: 0.9rem; font-weight: 600;">${item.name}</h6>
                        <div class="text-primary fw-bold" style="font-size: 0.85rem;">${item.price}</div>
                    </div>
                    <div class="d-flex align-items-center bg-light rounded-pill border px-2 py-1">
                        <button class="btn btn-sm btn-link text-decoration-none text-muted p-0 px-1 btn-decrease" style="font-size: 1.1rem; line-height: 1;"><i class='bx bx-minus'></i></button>
                        <span class="mx-2 fw-semibold text-dark item-qty" style="font-size: 0.9rem;">${item.quantity}</span>
                        <button class="btn btn-sm btn-link text-decoration-none text-muted p-0 px-1 btn-increase" style="font-size: 1.1rem; line-height: 1;"><i class='bx bx-plus'></i></button>
                    </div>
                </div>
            `;
        });

        $container.html(html);

        // Calculate Totals
        const tax = Math.round(subtotal * 0.08); // 8% tax
        const shipping = 20000;
        const total = subtotal + tax + shipping;

        $('#summary-subtotal').text(CartService.formatPrice(subtotal).replace('đ', ' VND'));
        $('#summary-tax').text(CartService.formatPrice(tax).replace('đ', ' VND'));
        $('#summary-shipping').text(CartService.formatPrice(shipping).replace('đ', ' VND'));
        $('#summary-total').text(CartService.formatPrice(total).replace('đ', ' VND'));

        // Attach + / - events
        $('.btn-increase').on('click', function() {
            const id = $(this).closest('.cart-item').data('id');
            CartService.updateQuantity(id, 1);
            renderCheckoutCart();
        });

        $('.btn-decrease').on('click', function() {
            const id = $(this).closest('.cart-item').data('id');
            CartService.updateQuantity(id, -1);
            renderCheckoutCart();
        });
        $('.btn-submit-order').on('click', function(e) {
            e.preventDefault();
            const cart = CartService.getCart();
            if (cart.length === 0) {
                alert('Giỏ hàng của bạn đang trống!');
                return;
            }

            const name = $('#checkout-name').val().trim();
            const phone = $('#checkout-phone').val().trim();
            const address = $('#checkout-address').val().trim();
            const agree = $('#agreeTerms').is(':checked');

            if (!name || !phone || !address ) {
                $('.required').each(function() {
                    if (!$(this).val().trim()) {
                        $(this).addClass('is-invalid');
                        
                    }
                });
                return;
            }

            if (!agree) {
                alert('Vui lòng đồng ý với Điều khoản & Điều kiện!');
                return;
            }

            const itemsList = cart.map(item => `${item.quantity}x ${item.name}`).join(', ');
            const totalText = $('#summary-total').text();
            
            const description = `Khách hàng: ${name}
SĐT: ${phone}
Địa chỉ: ${address}
Đơn hàng: ${itemsList}
Tổng tiền: ${totalText}`;

            if (typeof TaskService !== 'undefined') {
                const now = new Date();
                const deadlineStr = now.toLocaleDateString('vi-VN') + ' ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                TaskService.add({
                    title: 'Đơn hàng mới: ' + name,
                    description: description,
                    deadline: deadlineStr,
                    priority: 'High'
                });
            } else {
                console.error("TaskService is not loaded!");
            }

            const modal = new bootstrap.Modal(document.getElementById('successModal'));
            modal.show();

            CartService.clearCart();
            renderCheckoutCart();
        });
    }

    renderCheckoutCart();
});
