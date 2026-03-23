$(document).ready(function() {
    // If already logged in, redirect
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        if (currentUser.role === 'admin') window.location.href = 'admin.html';
        else window.location.href = 'test.html';
    }

    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        const username = $('#username').val().trim();
        const password = $('#password').val().trim();

        if (username === 'admin' && password === 'admin123') {
            localStorage.setItem('currentUser', JSON.stringify({ 
                username: 'admin', 
                role: 'admin', 
                name: 'Quản trị viên', 
                avatar: 'https://ui-avatars.com/api/?name=Admin&background=8b5cf6&color=fff',
                accumulatedSpend: 1500000 
            }));
            window.location.href = 'admin.html';
        } else if (username === 'user' && password === 'user123') {
            localStorage.setItem('currentUser', JSON.stringify({ 
                username: 'user', 
                role: 'user', 
                name: 'Người dùng', 
                avatar: 'https://ui-avatars.com/api/?name=User&background=60a5fa&color=fff',
                accumulatedSpend: 150000
            }));
            window.location.href = 'test.html';
        } else {
            $('#loginError').removeClass('d-none');
        }
    });
});
