$(document).ready(function () {

    function parseRevenue(description) {
        if (!description) return 0;
        // Look for "Tổng tiền: 1.050.000 VND" or similar in the text
        const match = description.match(/Tổng tiền:\s*([\d\.]+)\s*VND/i);
        if (match && match[1]) {
            return parseInt(match[1].replace(/\./g, ''), 10);
        }
        return 0; // If not an order or format is wrong, revenue is 0
    }

    function formatPrice(num) {
        return new Intl.NumberFormat('vi-VN').format(num) + ' VND';
    }

    function renderStats() {
        const allTasks = TaskService.getAll();
        
        // Filter tasks that look like orders (from our checkout logic)
        // Or we can just include all tasks, but orders usually have "Đơn hàng" in title.
        const orders = allTasks.filter(t => t.title.toLowerCase().includes('đơn hàng') || parseRevenue(t.description) > 0);
        
        let totalRevenue = 0;
        let completed = 0;
        let pending = 0;

        orders.forEach(order => {
            totalRevenue += parseRevenue(order.description);
            if (order.status === 'Done') {
                completed++;
            } else {
                pending++;
            }
        });

        // Update Summary Cards
        $('#totalRevenue').text(formatPrice(totalRevenue));
        $('#totalOrders').text(orders.length);
        $('#completedOrders').text(completed);
        $('#pendingOrders').text(pending);

        // Render Table
        const $tbody = $('#ordersTableBody');
        const $emptyMsg = $('#noOrdersMsg');

        if (orders.length === 0) {
            $emptyMsg.removeClass('d-none');
            $tbody.empty();
            return;
        }

        $emptyMsg.addClass('d-none');
        
        const rowsHtml = orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map(order => {
            const revenue = parseRevenue(order.description);
            
            // Extract customer info from description for cleaner display
            let customerInfo = "Khách vãng lai";
            if (order.description) {
                const custMatch = order.description.match(/Khách hàng:\s*(.*)/);
                if (custMatch && custMatch[1]) {
                    customerInfo = custMatch[1];
                } else {
                    customerInfo = order.title;
                }
            } else {
                customerInfo = order.title;
            }

            const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : (order.deadline || 'N/A');

            return `
                <tr>
                    <td class="ps-4 fw-semibold text-secondary">#${order.id.substring(0, 6).toUpperCase()}</td>
                    <td>${dateStr}</td>
                    <td>
                        <div class="fw-bold text-dark">${customerInfo}</div>
                        <div class="text-muted small text-truncate" style="max-width: 250px;" title="${(order.description || '').replace(/"/g, '&quot;')}">${order.description || ''}</div>
                    </td>
                    <td class="fw-bold text-primary">${formatPrice(revenue)}</td>
                    <td>
                        <span class="badge ${order.status === 'Done' ? 'bg-success bg-opacity-10 text-success border border-success' : 'bg-warning bg-opacity-10 text-warning border border-warning'} w-100" style="padding: 6px 12px; border-radius: 6px;">
                            ${order.status === 'Done' ? 'Hoàn thành' : 'Đang chờ'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        $tbody.html(rowsHtml);
    }

    renderStats();

    $('#btnExportStats').click(function() {
        alert("Tính năng xuất báo cáo Excel đang được phát triển!");
    });
});
