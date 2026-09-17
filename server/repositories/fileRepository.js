import { pool } from '../db/pool.js';

export const fileRepository = {
  async create(file) {
    const result = await pool.query(
      `
      INSERT INTO project_files (
        id,
        project_id,
        folder_id,
        file_name,
        blob_name,
        file_type,
        content_type,
        file_size,
        uploaded_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        file.id,
        file.projectId,
        file.folderId,
        file.fileName,
        file.blobName,
        file.fileType,
        file.contentType,
        file.fileSize,
        file.uploadedBy,
      ]
    );

    return result.rows[0];
  },

  async list(projectId, folderId) {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        folder_id,
        file_name,
        blob_name,
        file_type,
        content_type,
        file_size,
        uploaded_by,
        uploaded_at
      FROM project_files
      WHERE project_id = $1
        AND folder_id = $2
      ORDER BY uploaded_at DESC
      `,
      [projectId, folderId]
    );

    return result.rows;
  },

  async get(id) {
    const result = await pool.query(
      `
      SELECT
        id,
        project_id,
        folder_id,
        file_name,
        blob_name,
        file_type,
        content_type,
        file_size,
        uploaded_by,
        uploaded_at
      FROM project_files
      WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] ?? null;
  },

  async remove(id) {
    const result = await pool.query(
      `
      DELETE FROM project_files
      WHERE id = $1
      `,
      [id]
    );

    return result.rowCount > 0;
  },
};