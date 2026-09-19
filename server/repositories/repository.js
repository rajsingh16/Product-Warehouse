import { pool } from '../db/pool.js';

async function resolveUserId(userIdOrEmployeeId) {
  const result = await pool.query('SELECT user_id FROM users WHERE user_id = $1 OR emp_id = $1', [userIdOrEmployeeId]);
  return result.rows[0]?.user_id ?? userIdOrEmployeeId;
}

export const permissionsRepository = {
  async list() {
    const result = await pool.query('SELECT permission_code FROM permissions ORDER BY permission_code');
    return result.rows.map((row) => row.permission_code);
  },
};

export const usersRepository = {
  async list({ search, pageSize, offset }) {
    const values = [];
    const filters = [];
    if (search) {
      values.push(`%${search}%`);
      filters.push(`(u.user_id ILIKE $${values.length} OR u.emp_id ILIKE $${values.length} OR u.user_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const count = await pool.query(`SELECT COUNT(*)::int AS total FROM users u ${where}`, values);
    values.push(pageSize, offset);
    const result = await pool.query(
      `SELECT u.user_id, u.emp_id, u.user_name, u.mobile, u.email, u.date_of_joining, u.user_type,
              COALESCE(array_agg(up.permission_code) FILTER (WHERE up.permission_code IS NOT NULL), '{}') AS permissions
         FROM users u LEFT JOIN user_permissions up ON up.user_id = u.user_id
        ${where} GROUP BY u.user_id ORDER BY u.user_id LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return { rows: result.rows, total: count.rows[0].total };
  },

  async get(id) {
    const result = await pool.query(
      `SELECT u.user_id, u.emp_id, u.user_name, u.mobile, u.email, u.date_of_joining, u.user_type,
              COALESCE(array_agg(up.permission_code) FILTER (WHERE up.permission_code IS NOT NULL), '{}') AS permissions
         FROM users u LEFT JOIN user_permissions up ON up.user_id = u.user_id
        WHERE u.user_id = $1 GROUP BY u.user_id`, [id],
    );
    return result.rows[0] ?? null;
  },

  async create(user) {
    const result = await pool.query(
      `INSERT INTO users (
         user_id,
         user_name,
         mobile,
         email,
         date_of_joining,
         user_type,
         password_hash
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         user_id,
         emp_id,
         user_name,
         mobile,
         email,
         date_of_joining,
         user_type`,
      [
        user.userId,
        user.userName,
        user.mobile,
        user.email,
        user.dateOfJoining,
        user.userType,
        user.passwordHash,
      ],
    );
  
    return result.rows[0];
  },

  async update(id, user) {
    const result = await pool.query(
      `UPDATE users
          SET user_name = $2,
              mobile = $3,
              email = $4,
              date_of_joining = $5,
              user_type = $6,
              password_hash = COALESCE($7, password_hash)
        WHERE user_id = $1
        RETURNING
          user_id,
          emp_id,
          user_name,
          mobile,
          email,
          date_of_joining,
          user_type`,
      [
        id,
        user.userName,
        user.mobile,
        user.email,
        user.dateOfJoining,
        user.userType,
        user.passwordHash,
      ],
    );

    return result.rows[0] ?? null;
  },


  async remove(id) {
    const result = await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
    return result.rowCount > 0;
  },

  async permissions(id) {
    const result = await pool.query('SELECT permission_code FROM user_permissions WHERE user_id = $1 ORDER BY permission_code', [id]);
    return result.rows.map((row) => row.permission_code);
  },

  async replacePermissions(id, permissions) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM user_permissions WHERE user_id = $1', [id]);
      for (const permission of permissions) {
        await client.query('INSERT INTO user_permissions (user_id, permission_code) VALUES ($1, $2)', [id, permission]);
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return this.permissions(id);
  },
};

export const projectsRepository = {
  async list({
    search,
    status,
    assignedTo,
    pageSize,
    offset
  }) {
    const values = [];
    const filters = [];
  
    if (search) {
      values.push(`%${search}%`);
      filters.push(
        `p.project_name ILIKE $${values.length}`
      );
    }
  
    if (status) {
      values.push(status);
      filters.push(
        `p.project_status = $${values.length}`
      );
    }
  
    if (assignedTo) {
      values.push(assignedTo);
  
      filters.push(`
        EXISTS (
          SELECT 1
          FROM project_user_mapping pum
          WHERE pum.project_id = p.project_id
            AND pum.user_id = $${values.length}
        )
      `);
    }
  
    const where = filters.length
      ? `WHERE ${filters.join(' AND ')}`
      : '';
  
    const count = await pool.query(
      `
      SELECT COUNT(*)::int AS total
      FROM projects p
      ${where}
      `,
      values
    );
  
    values.push(pageSize, offset);
  
    const result = await pool.query(
      `
      SELECT
        p.project_id,
        p.project_name,
        p.project_status,
        p.created_at,
  
        COALESCE(
          json_agg(
            json_build_object(
              'userId', m.user_id,
              'userName', u.user_name,
              'empId', u.emp_id,
              'assignedOn', m.assigned_on
            )
          )
          FILTER (WHERE m.user_id IS NOT NULL),
          '[]'
        ) AS users
  
      FROM projects p
  
      LEFT JOIN project_user_mapping m
        ON m.project_id = p.project_id
  
      LEFT JOIN users u
        ON u.user_id = m.user_id
  
      ${where}
  
      GROUP BY p.project_id
  
      ORDER BY p.created_at DESC
  
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
      `,
      values
    );
  
    return {
      rows: result.rows,
      total: count.rows[0].total
    };
  },
  async get(id, assignedTo) {
    const values = [id];
  
    let assignedFilter = '';
  
    if (assignedTo) {
      values.push(assignedTo);
  
      assignedFilter = `
        AND EXISTS (
          SELECT 1
          FROM project_user_mapping pum
          WHERE pum.project_id = p.project_id
            AND pum.user_id = $${values.length}
        )
      `;
    }
  
    const result = await pool.query(
      `
      SELECT
        p.project_id,
        p.project_name,
        p.project_status,
        p.created_at,
  
        COALESCE(
          json_agg(
            json_build_object(
              'userId', m.user_id,
              'userName', u.user_name,
              'empId', u.emp_id,
              'assignedOn', m.assigned_on
            )
          )
          FILTER (WHERE m.user_id IS NOT NULL),
          '[]'
        ) AS users
  
      FROM projects p
  
      LEFT JOIN project_user_mapping m
        ON m.project_id = p.project_id
  
      LEFT JOIN users u
        ON u.user_id = m.user_id
  
      WHERE p.project_id = $1
      ${assignedFilter}
  
      GROUP BY p.project_id
      `,
      values
    );
  
    return result.rows[0] ?? null;
  },
  async create(project) {
    const result = await pool.query('INSERT INTO projects (project_id, project_name, project_status) VALUES ($1, $2, $3) RETURNING *', [project.projectId, project.projectName, project.projectStatus]);
    return result.rows[0];
  },
  async update(id, project) {
    const result = await pool.query('UPDATE projects SET project_name = $2, project_status = $3 WHERE project_id = $1 RETURNING *', [id, project.projectName, project.projectStatus]);
    return result.rows[0] ?? null;
  },
  async remove(id) {
    const result = await pool.query('DELETE FROM projects WHERE project_id = $1', [id]);
    return result.rowCount > 0;
  },
  async assignments(id) {
    const result = await pool.query('SELECT uni_id, project_id, user_id, assigned_on FROM project_user_mapping WHERE project_id = $1 ORDER BY assigned_on', [id]);
    return result.rows;
  },
  async assign(id, userId) {
    const result = await pool.query('INSERT INTO project_user_mapping (project_id, user_id) VALUES ($1, $2) RETURNING *', [id, await resolveUserId(userId)]);
    return result.rows[0];
  },
  async unassign(id, userId) {
    const result = await pool.query('DELETE FROM project_user_mapping WHERE project_id = $1 AND user_id = $2', [id, userId]);
    return result.rowCount > 0;
  },
};

export const taskMasterRepository = {
  async list({ search, includeInactive, pageSize, offset }) {
    const values = [];
    const filters = [];
    if (search) { values.push(`%${search}%`); filters.push(`(task_id ILIKE $${values.length} OR task_name ILIKE $${values.length})`); }
    if (!includeInactive) filters.push("status = 'A'");
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const count = await pool.query(`SELECT COUNT(*)::int AS total FROM task_master ${where}`, values);
    values.push(pageSize, offset);
    const result = await pool.query(`SELECT task_id, task_name, status FROM task_master ${where} ORDER BY task_id LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
    return { rows: result.rows, total: count.rows[0].total };
  },
  async create(task) {
    const result = await pool.query('INSERT INTO task_master (task_name, status) VALUES ($1, $2) RETURNING *', [task.taskName, task.status === 'Active' ? 'A' : 'I']);
    return result.rows[0];
  },
  async update(id, task) {
    const result = await pool.query('UPDATE task_master SET task_name = $2, status = $3 WHERE task_id = $1 RETURNING *', [id, task.taskName, task.status === 'Active' ? 'A' : 'I']);
    return result.rows[0] ?? null;
  },
  async remove(id) {
    const result = await pool.query('DELETE FROM task_master WHERE task_id = $1', [id]);
    return result.rowCount > 0;
  },
};

export const tasksRepository = {
  async list({ search, status, projectId, assignedTo, pageSize, offset }) {
    const values = [];
    const filters = [];
    if (search) { values.push(`%${search}%`); filters.push(`
    (CAST(m.pid AS TEXT) ILIKE $${values.length} 
    OR m.description ILIKE $${values.length} 
    OR tm.task_name ILIKE $${values.length}
    OR p.project_id ILIKE $${values.length}
    OR p.project_name ILIKE $${values.length}
    OR m.assigned_to ILIKE $${values.length}
    )`); }
    if (status) { values.push(status); 
    filters.push(`m.status = $${values.length}`); 
    }
    if (projectId) { 
    values.push(projectId); 
    filters.push(`m.project_id = $${values.length}`); }
    if (assignedTo) {
      values.push(assignedTo);
      filters.push(`m.assigned_to = $${values.length}`);
    }
  

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const count = await pool.query(`
    SELECT COUNT(*)::int AS total 
    FROM task_user_mapping m 
    JOIN task_master tm 
      ON tm.task_id = m.pid
    LEFT JOIN projects p
      ON p.project_id = m.project_id
    ${where}`, values);
    values.push(pageSize, offset);
    const result = await pool.query(
      `
      SELECT 
        m.id, 
        m.pid AS task_id, 
        m.project_id, 
        p.project_name, 
        m.description, 
        m.status, 
        m.reference_link, 
        m.reference_document, 
        m.assigned_to, 
        m.assigned_on, 
        tm.task_name
       FROM task_user_mapping m 
       JOIN task_master tm 
         ON tm.task_id = m.pid 
       LEFT JOIN projects p
         ON p.project_id = m.project_id
       ${where}
        ORDER BY m.assigned_on DESC NULLS LAST, m.id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return { rows: result.rows, total: count.rows[0].total };
  },
  async get(id, assignedTo) {
    const values =[id];
    let assignedFilter ='';
    if (assignedTo){
      values.push(assignedTo);
      assignedFilter =`AND m.assigned_to = $${values.length}`;
    }
    const result = await pool.query('SELECT m.id, m.pid AS task_id, m.project_id,p.project_name, m.description, m.status, m.reference_link, m.reference_document, m.assigned_to, m.assigned_on, tm.task_name FROM task_user_mapping m JOIN task_master tm ON tm.task_id = m.pid LEFT JOIN projects p ON p.project_id = m.project_id WHERE m.id = $1 ${assignedFilter}', values);
    return result.rows[0] ?? null;
  },
  async create(task) {
    const result = await pool.query('INSERT INTO task_user_mapping (pid, project_id, description, status, reference_link, reference_document, assigned_to, assigned_on) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [task.taskId,task.projectId, task.description, task.status, task.referenceLink, task.referenceDocument, task.assignedTo, task.assignedOn]);
    return result.rows[0];
  },
  async update(id, task) {
    const result = await pool.query('UPDATE task_user_mapping SET pid=$2, project_id = $3, description=$4, status=$5, reference_link=$6, reference_document=$7, assigned_to=$8, assigned_on=$9 WHERE id=$1 RETURNING *', [id, task.taskId, task.projectId, task.description, task.status, task.referenceLink, task.referenceDocument, task.assignedTo, task.assignedOn]);
    return result.rows[0] ?? null;
  },
  async remove(id) {
    const result = await pool.query('DELETE FROM task_user_mapping WHERE id = $1', [id]);
    return result.rowCount > 0;
  },
  async assignments(id) { const result = await pool.query('SELECT id, pid, assigned_to, assigned_on FROM task_user_mapping WHERE id=$1', [id]); return result.rows; },
  async assign(id, userId) { const result = await pool.query('UPDATE task_user_mapping SET assigned_to=$2 WHERE id=$1 RETURNING *', [id, userId]); return result.rows[0] ?? null; },
  async updateAssignment(id, _userId, assignedOn) { const result = await pool.query('UPDATE task_user_mapping SET assigned_on=$2 WHERE id=$1 RETURNING *', [id, assignedOn]); return result.rows[0] ?? null; },
  async unassign(id) { const result = await pool.query('UPDATE task_user_mapping SET assigned_to=NULL WHERE id=$1', [id]); return result.rowCount > 0; },
};
