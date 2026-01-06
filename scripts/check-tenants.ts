
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function check() {
    const connectionString = process.env.POSTGRES_URL || 'postgresql://omnizap:omnizap@localhost:5433/omnizap';
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query("SELECT id, name, custom_labels FROM tenants");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
check();
