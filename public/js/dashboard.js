const API_URL = '/api';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'index.html';

document.getElementById('userName').textContent = localStorage.getItem('username');

function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    notif.textContent = message;
    notif.className = `notification show notif-${type}`;
    setTimeout(() => {
        notif.className = 'notification';
    }, 4000);
}

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

function openCreateModal() {
    document.getElementById('createModal').classList.add('active');
}

function closeModal() {
    document.getElementById('createModal').classList.remove('active');
}

async function fetchServer() {
    try {
        const response = await fetch(`${API_URL}/server`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        renderServer(data.server);
    } catch (err) {
        console.error('error fetching server', err);
    }
}

function renderServer(server) {
    const list = document.getElementById('serverList');
    if (!server) {
        list.innerHTML = `
            <div class="empty-state">
                <p>You don't have any servers yet.</p>
                <button class="btn btn-small" style="margin-top: 20px;" onclick="openCreateModal()">Create my first server</button>
            </div>
        `;
        document.getElementById('btnCreateServer').style.display = 'block';
        return;
    }

    document.getElementById('btnCreateServer').style.display = 'none';
    
    const statusClass = server.status === 'online' ? 'status-online' : 'status-offline';
    
    list.innerHTML = `
        <div class="server-card">
            <div class="server-status ${statusClass}">
                <div class="dot"></div> ${server.status.toUpperCase()}
            </div>
            <div class="server-info">
                <h2>${server.name}</h2>
                <div class="server-details">
                    <div class="detail-item">Server IP <span>${server.ip || 'Provisioning...'}</span></div>
                    <div class="detail-item">Location <span>Azure Cloud</span></div>
                    <div class="detail-item">Memory RAM <span>${server.ram}</span></div>
                    <div class="detail-item">Storage <span>${server.storage}</span></div>
                </div>
            </div>
            
            ${server.status === 'online' ? `
                <div style="margin-top:20px; background: #0b0e14; padding: 15px; border-radius: 8px; border: 1px solid var(--border);">
                    <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">ACCESS CREDENTIALS</p>
                    <p style="font-size: 14px;">User: <b>${server.username_pterodactyl}</b></p>
                    <p style="font-size: 14px;">Pass: <b>${server.password_pterodactyl}</b></p>
                    <a href="${server.pterodactyl_link}" target="_blank" style="color: var(--acc-color); font-size: 14px; text-decoration: none; margin-top: 10px; display: inline-block;">Open Pterodactyl Panel &rarr;</a>
                </div>
            ` : ''}

            <div class="server-actions">
                <button class="btn btn-small" onclick="serverAction('restart')">Restart</button>
                <button class="btn btn-small btn-secondary" onclick="serverAction('stop')">Stop</button>
            </div>
        </div>
    `;

    // if provisioning, check again in 5 seconds
    if (server.status === 'provisioning') {
        setTimeout(fetchServer, 5000);
    }
}

async function createServer() {
    const name = document.getElementById('newServerName').value;
    if (!name) return showNotification('Please give your server a name', 'error');

    try {
        const response = await fetch(`${API_URL}/create-server`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name })
        });

        const data = await response.json();
        if (response.ok) {
            showNotification(data.message);
            closeModal();
            fetchServer();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (err) {
        showNotification('Error connecting to the system', 'error');
    }
}

async function serverAction(action) {
    showNotification(`Sending ${action} command...`);
    try {
        await fetch(`${API_URL}/server/action`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action })
        });
        showNotification('Server received the command!', 'success');
    } catch (err) {
        showNotification('Error sending command', 'error');
    }
}

fetchServer();
