require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || '2z2host-super-secret-key-999';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// helper: get client ip
const getIP = (req) => req.headers['x-forwarded-for'] || req.socket.remoteAddress;

// check vpn/blocked ip
function isIPBlocked(ip) {
    const vpnList = JSON.parse(fs.readFileSync(path.join(__dirname, 'vpn_db.json'), 'utf8'));
    const isVPN = vpnList.includes(ip);
    const isBlocked = db.prepare('SELECT 1 FROM blocked_ips WHERE ip = ?').get(ip);
    return isVPN || isBlocked;
}

// authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Session expired, please login again' });

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.status(401).json({ error: 'Invalid session' });
        req.user = user;
        next();
    });
}

// --- routes ---

// register logic
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    const ip = getIP(req);

    if (isIPBlocked(ip)) {
        return res.status(403).json({ error: 'Access denied: VPN or blocked IP' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
        stmt.run(username, email, hashedPassword);
        
        db.prepare('INSERT INTO system_logs (action, details, ip) VALUES (?, ?, ?)')
          .run('REGISTER', `user ${username} registered`, ip);

        res.json({ success: true, message: 'Account created successfully!' });
    } catch (err) {
        res.status(400).json({ error: 'This email is already in use' });
    }
});

// login logic
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const ip = getIP(req);

    if (isIPBlocked(ip)) {
        return res.status(403).json({ error: 'Access denied: VPN or blocked IP' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET, { expiresIn: '24h' });
    
    db.prepare('INSERT INTO system_logs (action, details, ip) VALUES (?, ?, ?)')
      .run('LOGIN', `user ${user.username} logged in`, ip);

    res.json({ token, username: user.username, role: user.role });
});

// get server info
app.get('/api/server', authenticateToken, (req, res) => {
    const server = db.prepare('SELECT * FROM servers WHERE user_id = ?').get(req.user.id);
    if (!server) return res.json({ server: null });
    res.json({ server });
});

// create server (mocking azure/pterodactyl logic)
app.post('/api/create-server', authenticateToken, async (req, res) => {
    const { name } = req.body;
    
    // limit 1 server per account
    const existing = db.prepare('SELECT id FROM servers WHERE user_id = ?').get(req.user.id);
    if (existing) return res.status(400).json({ error: 'You already have an active server' });

    // if provisioning, check again in 5 seconds
    const ip = getIP(req);
    const serverId = db.prepare('INSERT INTO servers (user_id, name, status) VALUES (?, ?, ?)')
                       .run(req.user.id, name, 'provisioning').lastInsertRowid;

    // simulate background task for azure
    setTimeout(() => {
        const mockIP = `20.201.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        const mockPwd = Math.random().toString(36).slice(-8);
        
        db.prepare(`
            UPDATE servers SET 
            ip = ?, 
            status = 'online', 
            pterodactyl_link = ?, 
            username_pterodactyl = ?, 
            password_pterodactyl = ? 
            WHERE id = ?
        `).run(
            mockIP, 
            `https://panel.2z2.top/server/${serverId}`, 
            req.user.username.toLowerCase(), 
            mockPwd, 
            serverId
        );

        db.prepare('INSERT INTO system_logs (action, details, ip) VALUES (?, ?, ?)')
          .run('SERVER_CREATED', `server ${name} provisioned for user ${req.user.username}`, 'system');
    }, 5000); // 5 seconds "provisioning"

    res.json({ success: true, message: 'Provisioning started, your server will be ready shortly!' });
});

// server actions (restart/stop) - mock
app.post('/api/server/action', authenticateToken, (req, res) => {
    const { action } = req.body;
    // in a real app, this would hit pterodactyl api
    res.json({ success: true, message: `Command '${action}' sent successfully` });
});

// --- admin routes ---

app.get('/api/admin/users', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    const users = db.prepare('SELECT id, username, email, role, created_at FROM users').all();
    res.json({ users });
});

app.get('/api/admin/logs', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    const logs = db.prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 50').all();
    res.json({ logs });
});

app.listen(PORT, () => {
    console.log(`2z2 Host backend running on http://localhost:${PORT}`);
});
