$(document).ready(function() {
    // ===== START INITIALIZATION =====
    initTheme();
    loadProfile();
    loadTasksData();
    initChart();
});

// ===== 1. THEME & DARK MODE =====
function initTheme() {
    const html = document.documentElement;
    const isDark = localStorage.getItem('flowershop-theme') === 'dark';
    
    if (isDark) {
        $(html).removeClass('light').addClass('dark');
        $('#theme-icon').text('dark_mode');
    }

    $('#dark-toggle').on('click', function() {
        $(html).toggleClass('dark light');
        const currentlyDark = $(html).hasClass('dark');
        localStorage.setItem('flowershop-theme', currentlyDark ? 'dark' : 'light');
        $('#theme-icon').text(currentlyDark ? 'dark_mode' : 'light_mode');
        updateChartTheme();
    });
}

// ===== 2. PROFILE DATA =====
function loadProfile() {
    const DEFAULT_AVATAR = '../Photo/person.png';

    const savedAvatar = localStorage.getItem('avatarImage');
    const savedName = localStorage.getItem('userName');

    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    } catch(e) {}

    // Priority: avatarImage key → currentUser.avatar → default
    const avatarSrc = savedAvatar || (currentUser && currentUser.avatar) || DEFAULT_AVATAR;
    const displayName = savedName || (currentUser && currentUser.displayName) || (currentUser && currentUser.email) || 'Admin';

    $('#headerAdminAvatar').attr('src', avatarSrc);
    $('#headerAdminName').text(displayName);
}

// ===== 3. TASKS DATA =====
function loadTasksData() {
    let tasks = [];
    try { 
        tasks = JSON.parse(localStorage.getItem('taskManager_tasks')) || []; 
    } catch(e) { 
        tasks = []; 
    }

    const total = tasks.length;
    const done = tasks.filter(t => t.status === 'Done').length;
    
    // Update main stat card
    $('#stat-tasks').text(done + ' / ' + total);

    // Update trend percentage
    const $trendEl = $('#stat-tasks-trend');
    if ($trendEl.length) {
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        $trendEl.html(`<i class='bx bx-trending-up'></i> +${percent}%`);
        $trendEl.removeClass('down').addClass('up');
    }

    // Render recent tasks list
    const $listEl = $('#recent-tasks-list');
    if (!$listEl.length) return;

    if (tasks.length === 0) {
        $listEl.html('<tr><td colspan="4" class="text-center text-muted py-4">Chưa có task nào.</td></tr>');
        return;
    }

    // Show 4 most recent tasks
    const recent = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
    
    const statusMap = {
        'Pending': { label: 'Chờ xử lý', cls: 'status-processing' },
        'Delivering': { label: 'Đang giao', cls: 'status-processing' },
        'Done': { label: 'Hoàn thành', cls: 'status-done' },
        'Cancelled': { label: 'Đã hủy', cls: 'bg-danger text-white' }
    };
    
    const priorityIcon = { 
        'High': "<i class='bx bxs-circle text-danger'></i>", 
        'Medium': "<i class='bx bxs-circle text-warning'></i>", 
        'Low': "<i class='bx bxs-circle text-success'></i>" 
    };

    const rowsUrl = recent.map(task => {
        const st = statusMap[task.status] || statusMap['Pending'];
        const pIcon = priorityIcon[task.priority] || priorityIcon['Low'];
        const deadlineStr = task.deadline ? task.deadline.split('-').reverse().join('/') : '--/--/----';
        
        return `
            <tr>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        ${pIcon}
                        <div>
                            <p class="order-name">${task.title || 'Untitled'}</p>
                            <p class="order-item">ID: #${task.id ? task.id.toString().substring(0,8) : '---'}</p>
                        </div>
                    </div>
                </td>
                <td class="text-muted" style="font-size: 0.75rem;">
                    <i class='bx bx-calendar'></i> ${deadlineStr}
                </td>
                <td class="text-end">
                    <span class="status-badge ${st.cls}">${st.label}</span>
                </td>
            </tr>
        `;
    }).join('');

    $listEl.html(rowsUrl);
}

// ===== 4. CROSS-TAB SYNC =====
const DEFAULT_AVATAR = '../Photo/person.png';
window.addEventListener('storage', function(e) {
    if (e.key === 'flowershop-theme') {
        const isDark = e.newValue === 'dark';
        const html = document.documentElement;
        $(html).toggleClass('dark', isDark);
        $(html).toggleClass('light', !isDark);
        $('#theme-icon').text(isDark ? 'dark_mode' : 'light_mode');
        updateChartTheme();
    }
    else if (e.key === 'taskManager_tasks') {
        loadTasksData();
    }
    else if (e.key === 'avatarImage') {
        $('#headerAdminAvatar').attr('src', e.newValue || DEFAULT_AVATAR);
    }
    else if (e.key === 'userName') {
        if (e.newValue) $('#headerAdminName').text(e.newValue);
    }
});

// ===== 5. REVENUE CHART =====
const chartData = {
    revenue: {
        7: { labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], data: [8500000, 10200000, 9800000, 12500000, 11000000, 15200000, 12500000] },
        30: { labels: Array.from({ length: 30 }, (_, i) => `${i + 1}/3`), data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8000000) + 7000000) }
    },
    orders: {
        7: { labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'], data: [32, 38, 35, 48, 42, 56, 48] },
        30: { labels: Array.from({ length: 30 }, (_, i) => `${i + 1}/3`), data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 30) + 25) }
    }
};

let currentType = 'revenue';
let currentPeriod = 7;
let chart;

function getChartColors() {
    const isDark = document.documentElement.classList.contains('dark');
    return {
        line: isDark ? '#FF9BB8' : '#7b5362',
        gradient1: isDark ? 'rgba(255,155,184,0.3)' : 'rgba(255,203,221,0.5)',
        gradient2: isDark ? 'rgba(255,155,184,0)' : 'rgba(255,203,221,0)',
        grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        text: isDark ? '#b0a0a4' : '#4f4447',
        tooltip: isDark ? '#2A2A2A' : '#ffffff',
        tooltipText: isDark ? '#EEEEEE' : '#1a1c1c',
    };
}

function initChart() {
    createChart();

    // Chart type toggle
    $('.chart-type-btn').on('click', function() {
        currentType = $(this).data('type');
        $('.chart-type-btn').removeClass('active');
        $(this).addClass('active');
        createChart();
    });

    // Period toggle
    $('.period-btn').on('click', function() {
        currentPeriod = parseInt($(this).data('period'));
        $('.period-btn').removeClass('active');
        $(this).addClass('active');
        createChart();
    });
}

function createChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const colors = getChartColors();
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, colors.gradient1);
    gradient.addColorStop(1, colors.gradient2);

    const d = chartData[currentType][currentPeriod];

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: d.labels,
            datasets: [{
                label: currentType === 'revenue' ? 'Doanh thu (VNĐ)' : 'Số đơn hàng',
                data: d.data,
                borderColor: colors.line,
                backgroundColor: gradient,
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: colors.line,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: colors.tooltip,
                    titleColor: colors.tooltipText,
                    bodyColor: colors.tooltipText,
                    borderColor: colors.grid,
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(ctx) {
                            if (currentType === 'revenue') {
                                return new Intl.NumberFormat('vi-VN').format(ctx.parsed.y) + 'đ';
                            }
                            return ctx.parsed.y + ' đơn hàng';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.text, font: { size: 11, family: 'Inter' } },
                    border: { display: false }
                },
                y: {
                    grid: { color: colors.grid },
                    ticks: {
                        color: colors.text,
                        font: { size: 11, family: 'Inter' },
                        callback: function(v) {
                            if (currentType === 'revenue') return (v / 1000000).toFixed(0) + 'M';
                            return v;
                        }
                    },
                    border: { display: false }
                }
            },
            animation: { duration: 800, easing: 'easeInOutQuart' }
        }
    });
}

function updateChartTheme() {
    if (chart) createChart();
}
