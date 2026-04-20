const API_URL = '/api';

function switchAuth(type) {
    if (type === 'register') {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('registerForm').style.display = 'none';
    }
}

function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = `notification show notif-${type}`;
    setTimeout(() => {
        notif.className = 'notification';
    }, 3000);
}

// login logic
document.getElementById('login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('role', data.role);
            window.location.href = 'dashboard.html';
        } else {
            showNotification(data.error || 'Something went wrong, please try again', 'error');
        }
    } catch (err) {
        showNotification('Server connection error', 'error');
    }
});

// register logic
document.getElementById('register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUser').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Account created! You can now login');
            switchAuth('login');
        } else {
            showNotification(data.error || 'Error creating account', 'error');
        }
    } catch (err) {
        showNotification('Server connection error', 'error');
    }
});
