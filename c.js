

    import pg from 'pg';

    const { Client } = pg;
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    const sql = `
    
    CREATE TABLE IF NOT EXISTS project_folders (
    folder_id VARCHAR(150) PRIMARY KEY,
    project_id VARCHAR(150) NOT NULL,
    parent_folder_id VARCHAR(150),
    folder_name VARCHAR(255) NOT NULL,
    created_by VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_folder_project
        FOREIGN KEY (project_id)
        REFERENCES projects (project_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_project_folder_parent
        FOREIGN KEY (parent_folder_id)
        REFERENCES project_folders (folder_id)
        ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_folder_name
    ON project_folders (
        project_id,
        COALESCE(parent_folder_id, ''),
        folder_name
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