import { DatabaseService } from '../src/services/database-service';
import { LogService } from '../src/services/log-service';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
    const logger = new LogService();
    const db = new DatabaseService(logger);

    try {
        await db.initialize();
        const users = await db.all('SELECT id, tenant_id, username, name, role, active FROM web_users');
        console.log('--- Web Users ---');
        console.table(users);

        const legacyAdmins = await db.all('SELECT id, tenant_id, username, name FROM admins');
        console.log('--- Legacy Admins ---');
        console.table(legacyAdmins);

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await db.close();
    }
}

run();
