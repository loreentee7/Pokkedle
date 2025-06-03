document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const { user, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        document.getElementById('login-error').classList.remove('hidden');
        document.getElementById('login-error').textContent = error.message;
        return;
    }
    localStorage.setItem('pokkedle-current-user', email);
    window.location.href = 'index.html';
});