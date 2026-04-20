const API_URL = '/api';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

if (!token || role !== 'admin') window.location.href = 'dashboard.html';

async function fetchUsers() {
    const response = await fetch(`${API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = data.users.map(u => `
        <tr style="border-bottom: 1px solid #1c232c;">
            <td style="padding: 12px;">${u.id}</td>
            <td>${u.username}</td>
            <td>${u.email}</td>
            <td><span style="color: ${u.role === 'admin' ? 'var(--acc-color)' : 'var(--text-secondary)'}">${u.role}</span></td>
            <td><button class="btn btn-small btn-secondary" onclick="banUser(${u.id})">Ban</button></td>
        </tr>
    `).join('');
}

async function fetchLogs() {
    const response = await fetch(`${API_URL}/admin/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const logList = document.getElementById('logList');
    logList.innerHTML = data.logs.map(l => `
        <div style="padding: 8px 0; border-bottom: 1px solid #1c232c;">
            <span style="color: var(--acc-color);">[${l.created_at}]</span> 
            <b style="color: var(--text-primary);">${l.action}:</b> ${l.details} 
            <i style="font-size: 10px;">(${l.ip})</i>
        </div>
    `).join('');
}

function banUser(id) {
    alert('ban feature would be implemented here (mock)');
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

fetchUsers();
fetchLogs();
setInterval(fetchLogs, 10000); // refresh logs every 10s
