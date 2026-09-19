import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const sql = `
-- 10. PROJECT FILES
CREATE TABLE IF NOT EXISTS project_files (
    id VARCHAR(150) PRIMARY KEY,
    project_id VARCHAR(150) NOT NULL,
    folder_id VARCHAR(150) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    blob_name VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100),
    content_type VARCHAR(255),
    file_size BIGINT NOT NULL,
    uploaded_by VARCHAR(150),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_file_project
        FOREIGN KEY (project_id)
        REFERENCES projects (project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_file_folder
        FOREIGN KEY (folder_id)
        REFERENCES project_folders (folder_id)
        ON DELETE CASCADE
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