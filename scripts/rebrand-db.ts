
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function rebrand() {
    const connectionString = process.env.POSTGRES_URL || 'postgresql://omnizap:omnizap@localhost:5433/omnizap';
    console.log('Connecting to:', connectionString);

    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to database.');

        // Update Tenants
        const res1 = await client.query("UPDATE tenants SET name = REPLACE(REPLACE(name, 'Nyvlo Omnichannel', 'Nyvlo Omnichannel'), 'Nyvlo Omnichannel', 'Nyvlo Omnichannel') WHERE name LIKE '%Nyvlo Omnichannel%' OR name LIKE '%Nyvlo Omnichannel%'");
        console.log(`Updated ${res1.rowCount} tenants.`);

        // Update Bot Settings
        const res2 = await client.query("UPDATE bot_settings SET company_name = REPLACE(REPLACE(company_name, 'Nyvlo Omnichannel', 'Nyvlo Omnichannel'), 'Nyvlo Omnichannel', 'Nyvlo Omnichannel') WHERE company_name LIKE '%Nyvlo Omnichannel%' OR company_name LIKE '%Nyvlo Omnichannel%'");
        console.log(`Updated ${res2.rowCount} bot_settings.`);

        // Update Plans
        const res3 = await client.query("UPDATE plans SET name = REPLACE(REPLACE(name, 'Nyvlo Omnichannel', 'Nyvlo Omnichannel'), 'Nyvlo Omnichannel', 'Nyvlo Omnichannel'), description = REPLACE(REPLACE(description, 'Nyvlo Omnichannel', 'Nyvlo Omnichannel'), 'Nyvlo Omnichannel', 'Nyvlo Omnichannel') WHERE name LIKE '%Nyvlo Omnichannel%' OR name LIKE '%Nyvlo Omnichannel%' OR description LIKE '%Nyvlo Omnichannel%' OR description LIKE '%Nyvlo Omnichannel%'");
        console.log(`Updated ${res3.rowCount} plans.`);

        console.log('Rebranding database complete!');
    } catch (err) {
        console.error('Error rebranding database:', err);
    } finally {
        await client.end();
    }
}

rebrand();
