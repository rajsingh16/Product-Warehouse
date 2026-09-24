import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http.js';
import { verifyPassword } from '../utils/password.js';
//import { maskPhone, normalizePhone, sendWhatsAppOtp } from './whatsapp.js';

const TTL = 5 * 60 * 1000;
const RESEND = 30 * 1000;
const MAX_ATTEMPTS = 5;
const generic = 'Invalid user ID or password.';

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new HttpError(500, 'JWT_SECRET is not configured');
  return secret;
}

function tokenFor(user, sessionId) {
  const secret = jwtSecret();
  const header = Buffer.from(
    JSON.stringify({ 
      alg: 'HS256', typ: 'JWT' 
    })
  ).toString('base64url'); 
  const payload = Buffer.from(
    JSON.stringify({ sub: user.user_id,sessionId, exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60 })).toString('base64url'); const signature = crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url'); return `${header}.${payload}.${signature}`; }
function publicUser(row) { return { id: row.user_id, userId: row.user_id, employeeId: row.emp_id, name: row.user_name, email: row.email, role: row.user_type === 'Administrator' ? 'Administrator' : 'Employee', userType: row.user_type, whatsappLastDigits: row.mobile?.slice(-2) ?? '', permissions: row.permissions ?? [] }; }
function otpHash(otp) { return crypto.createHash('sha256').update(`${otp}:${jwtSecret()}`).digest('hex'); }
function newOtp() { return String(crypto.randomInt(0, 1000000)).padStart(6, '0'); }

export async function beginLogin(userId, password) {
  const result = await pool.query(
    `
    SELECT
      u.*,
      COALESCE(
        array_agg(up.permission_code)
        FILTER (WHERE up.permission_code IS NOT NULL),
        '{}'
      ) AS permissions
    FROM users u
    LEFT JOIN user_permissions up
      ON up.user_id = u.user_id
    WHERE u.user_id = $1
       OR u.emp_id = $1
    GROUP BY u.user_id
    `,
    [userId]
  );

  const user = result.rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, generic);
  }

  /*
   * Do NOT create a new session yet.
   *
   * First check whether this account already
   * has an active session.
   */
  if (user.active_session_id) {
    return {
      requiresSessionConfirmation: true,
      message:
        'This account is already logged in from another session.',
      user: publicUser(user),
    };
  }

  /*
   * No existing session → create one.
   */
  const sessionId = crypto.randomUUID();

  await pool.query(
    `
    UPDATE users
    SET active_session_id = $1
    WHERE user_id = $2
    `,
    [sessionId, user.user_id]
  );

  return {
    requiresSessionConfirmation: false,
    token: tokenFor(user, sessionId),
    user: publicUser(user),
  };
}
export async function replaceSession(userId, password) {
  const result = await pool.query(
    `
    SELECT
      u.*,
      COALESCE(
        array_agg(up.permission_code)
        FILTER (WHERE up.permission_code IS NOT NULL),
        '{}'
      ) AS permissions
    FROM users u
    LEFT JOIN user_permissions up
      ON up.user_id = u.user_id
    WHERE u.user_id = $1
       OR u.emp_id = $1
    GROUP BY u.user_id
    `,
    [userId]
  );

  const user = result.rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new HttpError(401, generic);
  }

  const sessionId = crypto.randomUUID();

  await pool.query(
    `
    UPDATE users
    SET active_session_id = $1
    WHERE user_id = $2
    `,
    [sessionId, user.user_id]
  );

  return {
    token: tokenFor(user, sessionId),
    user: publicUser(user),
  };
}

export async function logoutSession(userId, sessionId) {
  await pool.query(
    `
    UPDATE users
    SET active_session_id = NULL
    WHERE user_id = $1
      AND active_session_id = $2
    `,
    [userId, sessionId]
  );

  return { loggedOut: true };
}

export async function verifyOtp(challengeId, otp) {
  const result = await pool.query(
    `SELECT
       c.*,
       u.*,
       COALESCE(
         array_agg(up.permission_code)
         FILTER (WHERE up.permission_code IS NOT NULL),
         '{}'
       ) permissions
     FROM otp_challenges c
     JOIN users u ON u.user_id = c.user_id
     LEFT JOIN user_permissions up ON up.user_id = u.user_id
     WHERE c.challenge_id = $1
     GROUP BY c.challenge_id, u.user_id`,
    [challengeId]
  );

  const challenge = result.rows[0];

  if (
    !challenge ||
    challenge.consumed_at ||
    new Date(challenge.expires_at).getTime() < Date.now()
  ) {
    throw new HttpError(401, 'Verification code expired or invalid');
  }

  if (challenge.attempt_count >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'Too many verification attempts');
  }

  if (
    !/^\d{6}$/.test(otp) ||
    otpHash(otp) !== challenge.otp_hash
  ) {
    await pool.query(
      `UPDATE otp_challenges
       SET attempt_count = attempt_count + 1
       WHERE challenge_id = $1`,
      [challengeId]
    );

    throw new HttpError(401, 'Invalid verification code');
  }

  await pool.query(
    `UPDATE otp_challenges
     SET consumed_at = NOW()
     WHERE challenge_id = $1`,
    [challengeId]
  );

  // Create ONE new session
  const sessionId = crypto.randomUUID();

  await pool.query(
    `
    UPDATE users
    SET active_session_id = $1
    WHERE user_id = $2
    `,
    [sessionId, challenge.user_id]
  );

  return {
    token: tokenFor(challenge, sessionId),
    user: publicUser(challenge),
  };
}

export async function resendOtp(challengeId) {
  const result = await pool.query('SELECT c.*,u.mobile FROM otp_challenges c JOIN users u ON u.user_id=c.user_id WHERE c.challenge_id=$1 AND c.consumed_at IS NULL', [challengeId]);
  const current = result.rows[0]; if (!current) throw new HttpError(401, 'Session expired. Please login again.');
  if (new Date(current.expires_at).getTime() < Date.now()) throw new HttpError(401, 'Verification code expired. Please login again.');
  if (new Date(current.resend_available_at).getTime() > Date.now()) throw new HttpError(429, 'Too many resend requests');
  const otp = newOtp(); const now = Date.now(); await pool.query('UPDATE otp_challenges SET otp_hash=$2,expires_at=to_timestamp($3/1000.0),resend_available_at=to_timestamp($4/1000.0),attempt_count=0 WHERE challenge_id=$1', [challengeId, otpHash(otp), now + TTL, now + RESEND]); await sendWhatsAppOtp(normalizePhone(current.mobile), otp); return { challengeId, maskedPhone: maskPhone(normalizePhone(current.mobile)), expiresAt: now + TTL, resendAvailableAt: now + RESEND };
}
