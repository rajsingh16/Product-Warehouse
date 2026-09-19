import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `

CREATE TABLE IF NOT EXISTS permissions (
    permission_code TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

`;

async function main() {
  try {
    console.log('Connecting to PostgreSQL...');

    await client.connect();

    console.log('Connected successfully.');
    console.log('Creating Project Warehouse database schema...');

    await client.query('BEGIN');

    await client.query(sql);

    await client.query('COMMIT');

    console.log('');
    console.log('========================================');
    console.log('ALL TABLES CREATED SUCCESSFULLY');
    console.log('========================================');

  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('DATABASE SCHEMA CREATION FAILED');
    console.error('========================================');
    console.error(error);

    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // Ignore rollback error
    }

    process.exitCode = 1;

  } finally {
    await client.end();
  }
}

main();