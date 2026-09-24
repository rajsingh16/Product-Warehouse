import { pool } from '../db/pool.js';

// password_hash is never selected in the normal profile response.
const PROFILE_SELECT = `
  SELECT
    user_id,
    emp_id,
    user_name,
    designation,
    mobile,
    email,
    date_of_joining,
    user_type,
    'active' AS status
  FROM users
  WHERE user_id = $1
`;

export async function getProfile(userId) {
  const { rows } = await pool.query(
    PROFILE_SELECT,
    [userId]
  );

  return rows[0] ?? null;
}

// Only these fields can be changed from the profile page.
export async function updateProfile(
  userId,
  { userName, mobile, email }
) {
  const { rowCount } = await pool.query(
    `
      UPDATE users
      SET
        user_name = $2,
        mobile = $3,
        email = $4
      WHERE user_id = $1
    `,
    [
      userId,
      userName,
      mobile,
      email,
    ]
  );

  return rowCount > 0
    ? await getProfile(userId)
    : null;
}

// Used only by the change-password flow.
// password_hash is deliberately not included in getProfile().
export async function getPasswordHash(userId) {
  const { rows } = await pool.query(
    `
      SELECT password_hash
      FROM users
      WHERE user_id = $1
    `,
    [userId]
  );

  return rows[0]?.password_hash ?? null;
}

export async function updatePassword(
  userId,
  passwordHash
) {
  const { rowCount } = await pool.query(
    `
      UPDATE users
      SET password_hash = $2
      WHERE user_id = $1
    `,
    [
      userId,
      passwordHash,
    ]
  );

  return rowCount > 0;
}