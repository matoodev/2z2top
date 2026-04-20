const db = require('./db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    const username = 'admin';
    const email = 'mato@mato.com';
    const password = '2z2host'; // change this when u are going to use it really
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)')
            .run(username, email, hashedPassword, 'admin');
        console.log('--- ADMIN USER CREATED ---');
        console.log('User: mato@mato.com');
        console.log('Pass: 2z2host');
        console.log('--------------------------');
    } catch (err) {
        console.log('Admin already exists or error:', err.message);
    }
}

createAdmin();
