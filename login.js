document.getElementById('login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    let users = JSON.parse(localStorage.getItem('pokkedle-users') || '{}');
    if (!users[username] || users[username].password !== password) {
        document.getElementById('login-error').classList.remove('hidden');
        return;
    }
    localStorage.setItem('pokkedle-current-user', username);
    window.location.href = 'index.html';
});