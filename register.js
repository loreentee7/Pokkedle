// Asegúrate de importar supabaseClient.js antes de este script en register.html

document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;

    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        document.getElementById('register-error').classList.remove('hidden');
        document.getElementById('register-error').textContent = error.message;
        return;
    }
    window.location.href = 'login.html';
});