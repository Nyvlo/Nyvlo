import * as bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createAdmin() {
  console.log('\n🔐 Criar Usuário Administrador - Nyvlo Omnichannel\n');
  
  const username = await question('Username: ');
  const name = await question('Nome completo: ');
  const email = await question('Email (opcional): ');
  const password = await question('Senha: ');
  
  if (!username || !name || !password) {
    console.error('\n❌ Username, nome e senha são obrigatórios!');
    rl.close();
    process.exit(1);
  }

  const db = new Database('data/bot.db');
  
  // Check if user exists
  const existing = db.prepare('SELECT id FROM web_users WHERE username = ?').get(username);
  if (existing) {
    console.error('\n❌ Usuário já existe!');
    rl.close();
    db.close();
    process.exit(1);
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const passwordHash = await bcrypt.hash(password, 10);
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO web_users (
      id, username, email, password_hash, name, role, 
      allowed_instances, active, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 'admin', '["*"]', 1, ?, ?)
  `).run(id, username, email || '', passwordHash, name, timestamp, timestamp);

  console.log('\n✅ Usuário administrador criado com sucesso!');
  console.log(`   ID: ${id}`);
  console.log(`   Username: ${username}`);
  console.log(`   Role: admin`);
  
  rl.close();
  db.close();
}

createAdmin().catch(console.error);
