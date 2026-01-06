
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

async function createTestAgent() {
    const db = new Database('data/bot.db');
    const passwordHash = await bcrypt.hash('agent123', 10);

    const id = 'test_agent_id';
    const username = 'testagent';
    const name = 'Test Agent';
    const role = 'agent';
    const allowedInstances = JSON.stringify(['wa_1766516106416_hlad8y8ag']);

    try {
        db.prepare(`
      INSERT INTO web_users (id, username, password_hash, name, role, allowed_instances, active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).run(id, username, passwordHash, name, role, allowedInstances);
        console.log('Test agent created successfully');
    } catch (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
            console.log('Test agent already exists');
        } else {
            console.error('Error creating test agent:', err);
        }
    } finally {
        db.close();
    }
}

createTestAgent();
