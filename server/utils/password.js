import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';

const SALT_ROUNDS = 12;
const BCRYPT_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export const isHashed = (value) => typeof value === 'string' && BCRYPT_RE.test(value);

/** Always use this when storing a password (new users, password changes). */
export const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

/**
 * Accepts both storage formats during the transition:
 *  - bcrypt hash  -> bcrypt.compare
 *  - legacy plaintext -> constant-time comparison
 */
export async function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string' || !stored) return false;
  if (isHashed(stored)) return bcrypt.compare(plain, stored);
  const a = crypto.createHash('sha256').update(plain).digest();
  const b = crypto.createHash('sha256').update(stored).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Optional: after a successful login with a legacy plaintext password, re-store it as a hash.
 * Off by default. Enable with UPGRADE_PLAINTEXT_PASSWORDS=true in .env.
 */
export async function upgradeLegacyPassword(userId, plain, stored) {
  if (process.env.UPGRADE_PLAINTEXT_PASSWORDS !== 'true' || isHashed(stored)) return;
  await pool.query('UPDATE users SET password_hash = $2 WHERE user_id = $1 AND password_hash = $3', [
    userId,
    await hashPassword(plain),
    stored,
  ]);
}