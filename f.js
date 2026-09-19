import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id TEXT NOT NULL,
    permission_code TEXT NOT NULL,
    assigned_on TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, permission_code),

    CONSTRAINT user_permissions_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users (user_id)
        ON DELETE CASCADE,

    CONSTRAINT user_permissions_permission_fk
        FOREIGN KEY (permission_code)
        REFERENCES permissions (permission_code)
        ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_code
    ON user_permissions (permission_code);


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