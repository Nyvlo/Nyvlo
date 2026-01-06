import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../src/services/database-service';
import { LogService } from '../src/services/log-service';

async function createSaaSAdmin() {
  const logger = new LogService();
  const db = new DatabaseService(logger);

  await db.initialize();

  const username = 'admin';
  const name = 'Admin SaaS';
  const email = 'admin@nyvlo.com';
  const password = 'admin123';
  const tenantId = 'system-default';

  // Check if user exists
  const existing = await db.get('SELECT id FROM web_users WHERE username = ? AND tenant_id = ?', [username, tenantId]);

  if (existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await db.run('UPDATE web_users SET role = ?, password_hash = ?, active = 1 WHERE username = ? AND tenant_id = ?', ['superadmin', passwordHash, username, tenantId]);
    console.log('✅ SaaS Admin updated to superadmin and password reset to admin123');
    process.exit(0);
  }

  const id = `user_${Date.now()}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const timestamp = new Date().toISOString();

  await db.run(`
    INSERT INTO web_users (
      id, tenant_id, username, email, password_hash, name, role, 
      allowed_instances, active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'superadmin', '["*"]', 1, ?)
  `, [id, tenantId, username, email, passwordHash, name, timestamp]);

  console.log('✅ SaaS Admin created for system-default');
  console.log('Username: admin');
  console.log('Password: admin123');
  process.exit(0);
}

createSaaSAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
