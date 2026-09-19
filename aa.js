import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
-- Create required sequences first
CREATE SEQUENCE IF NOT EXISTS emp_id_seq;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    project_id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    project_status TEXT NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT projects_project_name_not_blank
        CHECK (length(btrim(project_name)) > 0)
);

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    user_id TEXT NOT NULL,
    emp_id TEXT NOT NULL DEFAULT ('EMP'::text || lpad((nextval('emp_id_seq'::regclass))::text, 3, '0'::text)),
    user_name TEXT NOT NULL,
    mobile TEXT,
    email TEXT NOT NULL,
    user_type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    password_hash TEXT,
    active_session_id UUID,
    date_of_joining DATE,
    
    CONSTRAINT users_pkey PRIMARY KEY (user_id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_emp_id_key UNIQUE (emp_id),
    CONSTRAINT users_user_type_check CHECK (user_type = ANY (ARRAY['Administrator'::text, 'User'::text]))
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