$(document).ready(function () {

    function updateAdminDashboard(filterStatus = 'all') {
        const tasks = TaskService.getAll(); //Lấy dữ liệu từ LocalStorage
        const today = new Date().toISOString().split('T')[0];
        // Cập nhật các con số thống kê
        $('#totalTasks').text(tasks.length);
        $('#completedTasks').text(tasks.filter(t => t.status === 'Done').length);
        $('#pendingTasks').text(tasks.filter(t => t.status === 'Pending').length);
        $('#overdueTasks').text(tasks.filter(t => {
            const today = new Date().toISOString().split('T')[0];
            return t.deadline < today && t.status !== 'Done';
        }).length);
        $('#highPriority').text(tasks.filter(t => t.priority === 'High').length);
        $('#mediumPriority').text(tasks.filter(t => t.priority === 'Medium').length);
        // Render bảng công việc gần đây
        // Render bảng công việc gần đây
        const $list = $('#recentTasksList');
        const $empty = $('#noTasksMsg');

        if (tasks.length > 0) {
            $empty.addClass('d-none');
            const recent = [...tasks].reverse().slice(0, 5); // Lấy 5 task mới nhất
            $list.html(recent.map(t => `
                <tr>
                    <td class="fw-bold text-start">${t.title}</td>
                    <td><span class="badge ${t.priority === 'High' ? 'bg-danger' : 'bg-warning text-dark'}">${t.priority}</span></td>
                    <td class="text-muted">${t.deadline}</td>
                    <td><span class="badge ${t.status === 'Done' ? 'bg-success' : 'bg-info'}">${t.status}</span></td>
                </tr>
            `).join(''));
        } else {
            $empty.removeClass('d-none');
            $list.empty();
        }
    }

    // Chạy ngay khi load
    updateAdminDashboard();

    // Hiệu ứng click cho tất cả button (đã yêu cầu)
    $('.btn').on('click', function () {
        console.log("Đã click: " + $(this).attr('title'));
    });
});
