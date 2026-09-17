import { pool } from '../db/pool.js';

export const folderRepository = {
  async listByProject(projectId) {
    const result = await pool.query(
      `
      SELECT
        folder_id,
        project_id,
        parent_folder_id,
        folder_name,
        created_by,
        created_at
      FROM project_folders
      WHERE project_id = $1
      ORDER BY created_at ASC, folder_name ASC
      `,
      [projectId]
    );

    return result.rows;
  },

  async get(id) {
    const result = await pool.query(
      `
      SELECT
        folder_id,
        project_id,
        parent_folder_id,
        folder_name,
        created_by,
        created_at
      FROM project_folders
      WHERE folder_id = $1
      `,
      [id]
    );

    return result.rows[0] ?? null;
  },

  async create(folder) {
    const result = await pool.query(
      `
      INSERT INTO project_folders (
        folder_id,
        project_id,
        parent_folder_id,
        folder_name,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [
        folder.id,
        folder.projectId,
        folder.parentFolderId ?? null,
        folder.name,
        folder.createdBy,
      ]
    );

    return result.rows[0];
  },

  async remove(id) {
    const result = await pool.query(
      `
      DELETE FROM project_folders
      WHERE folder_id = $1
      `,
      [id]
    );

    return result.rowCount > 0;
  },
  async getFileCountsByProject(projectId) {
    const result = await pool.query(
      `
      SELECT
        folder_id,
        COUNT(*)::int AS file_count
      FROM project_files
      WHERE project_id = $1
      GROUP BY folder_id
      `,
      [projectId]
    );
  
    return result.rows;
  },
};