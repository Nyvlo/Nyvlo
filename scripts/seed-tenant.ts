import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function seedTenant() {
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL
    });

    try {
        const client = await pool.connect();
        console.log('Connectado ao PostgreSQL');

        // Create system-default tenant if it doesn't exist
        await client.query(`
            INSERT INTO tenants (id, name, status, plan_id, max_instances, max_agents, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO NOTHING
        `, ['system-default', 'Nyvlo System', 'active', 'enterprise', 100, 100]);

        console.log('Tenant system-default garantido');
        client.release();
    } catch (err) {
        console.error('Erro ao semear tenant:', err);
    } finally {
        await pool.end();
    }
}

seedTenant();
