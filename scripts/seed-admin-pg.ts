import { DatabaseService } from '../src/services/database-service';
import { LogService } from '../src/services/log-service';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    const logger = new LogService();
    const db = new DatabaseService(logger);

    try {
        await db.initialize();

        const username = 'admin';
        const password = '123';
        const name = 'Administrador Sistema';
        const tenantId = 'system-default';

        // Check if admin exists
        const existing = await db.get('SELECT id FROM web_users WHERE username = ?', [username]);

        if (existing) {
            console.log('Usuário admin já existe. Atualizando senha para "123"...');
            const passwordHash = await bcrypt.hash(password, 10);
            await db.run('UPDATE web_users SET password_hash = ? WHERE username = ?', [passwordHash, username]);
            console.log('Senha atualizada com sucesso!');
        } else {
            console.log('Criando usuário admin...');
            const id = `user_${Date.now()}_admin`;
            const passwordHash = await bcrypt.hash(password, 10);

            await db.run(`
                INSERT INTO web_users (id, tenant_id, username, password_hash, name, role, active, allowed_instances)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [id, tenantId, username, passwordHash, name, 'admin', 1, '["*"]']);

            console.log('Usuário admin criado com sucesso!');
            console.log('Username: admin');
            console.log('Password: 123');
        }

    } catch (error) {
        console.error('Erro ao criar admin:', error);
    } finally {
        await db.close();
    }
}

run();
