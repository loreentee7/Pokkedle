document.getElementById('register-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

    let users = JSON.parse(localStorage.getItem('pokkedle-users') || '{}');
    if (users[username]) {
        document.getElementById('register-error').classList.remove('hidden');
        return;
    }
    users[username] = { password, pokedex: [] };
    localStorage.setItem('pokkedle-users', JSON.stringify(users));
    localStorage.setItem('pokkedle-current-user', username);
    window.location.href = 'index.html';
});