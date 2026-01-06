/**
 * Script para criar um usuário admin padrão
 * Execute com: npx ts-node scripts/create-default-admin.ts
 */

import * as bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

async function createDefaultAdmin() {
  console.log('\n🔐 Criando Usuário Admin Padrão - Nyvlo Omnichannel\n');

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'bot.db');
  const db = new Database(dbPath);

  // Create table if not exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS web_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'agent',
      allowed_instances TEXT DEFAULT '[]',
      active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT,
      last_login TEXT
    )
  `);

  const username = 'admin';
  const name = 'Administrador';
  const email = 'admin@nyvlo.com';
  const password = 'admin123'; // Senha padrão - MUDE APÓS O PRIMEIRO LOGIN!

  // Check if admin already exists
  const existing = db.prepare('SELECT id, username FROM web_users WHERE username = ?').get(username) as any;

  if (existing) {
    console.log('⚠️  Usuário admin já existe!');
    console.log(`   ID: ${existing.id}`);
    console.log(`   Username: ${existing.username}`);
    console.log('\n📝 Para fazer login, use:');
    console.log(`   Username: admin`);
    console.log(`   Senha: (a senha que você definiu anteriormente)`);
    db.close();
    return;
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO web_users (
      id, username, email, password_hash, name, role, 
      allowed_instances, active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'admin', '["*"]', 1, ?, ?)
  `).run(id, username, email, passwordHash, name, timestamp, timestamp);

  console.log('✅ Usuário administrador criado com sucesso!\n');
  console.log('📝 Credenciais de acesso:');
  console.log('   ┌─────────────────────────────────┐');
  console.log('   │  Username: admin                │');
  console.log('   │  Senha:    admin123             │');
  console.log('   └─────────────────────────────────┘');
  console.log('\n⚠️  IMPORTANTE: Mude a senha após o primeiro login!\n');

  db.close();
}

createDefaultAdmin().catch(console.error);
