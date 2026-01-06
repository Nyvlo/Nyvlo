import { DatabaseService } from '../src/services/database-service';
import { LogService } from '../src/services/log-service';

async function migrate() {
    const logger = new LogService();
    const db = new DatabaseService(logger);

    try {
        await db.initialize();
        console.log('Database initialized. Starting migration...');

        const tables = [
            'users', 'sessions', 'appointments', 'enrollments', 'conversations',
            'notifications', 'documents', 'admins', 'web_users', 'web_conversations',
            'web_messages', 'web_instances', 'web_conversation_ratings', 'web_contacts',
            'web_group_participants', 'web_quick_messages', 'web_labels',
            'web_contact_custom_fields', 'web_agent_status_history'
        ];

        for (const table of tables) {
            try {
                // Check if tenant_id exists
                const columnCheck = await db.get(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = ? AND column_name = 'tenant_id'
                `, [table]);

                if (!columnCheck) {
                    console.log(`Adding tenant_id to ${table}...`);
                    // Admin table allows null for superadmins initially
                    const nullable = table === 'admins' ? '' : 'NOT NULL';

                    await db.exec(`ALTER TABLE ${table} ADD COLUMN tenant_id TEXT`);
                    await db.run(`UPDATE ${table} SET tenant_id = 'system-default' WHERE tenant_id IS NULL`);

                    if (table !== 'admins') {
                        await db.exec(`ALTER TABLE ${table} ALTER COLUMN tenant_id SET NOT NULL`);
                        await db.exec(`ALTER TABLE ${table} ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)`);
                    }
                }
            } catch (err) {
                console.error(`Error migrating table ${table}:`, err);
            }
        }

        console.log('Migration completed successfully!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await db.close();
    }
}

migrate();
