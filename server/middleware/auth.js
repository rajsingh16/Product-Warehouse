import crypto from 'crypto';
import { pool } from '../db/pool.js';
import { HttpError } from '../utils/http.js';

function base64UrlDecode(value) {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function verifyJwt(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new HttpError(500, 'JWT_SECRET is not configured');
  const parts = token.split('.');
  if (parts.length !== 3) throw new HttpError(401, 'Invalid authentication token');
  const [encodedHeader, encodedPayload, signature] = parts;
  const expected = crypto.createHmac('sha256', secret).update(`${encodedHeader}.${encodedPayload}`).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new HttpError(401, 'Invalid authentication token');
  }
  let payload;
  try { payload = JSON.parse(base64UrlDecode(encodedPayload)); } catch { throw new HttpError(401, 'Invalid authentication token'); }
  if (payload.exp && Number(payload.exp) <= Math.floor(Date.now() / 1000)) throw new HttpError(401, 'Authentication token expired');
  const userId = payload.userId ?? payload.sub;
  if (typeof userId !== 'string' || userId.trim() === '') throw new HttpError(401, 'Authentication token has no user identity');
  const sessionId = payload.sessionId;

  if (
    typeof sessionId !== 'string' ||
    sessionId.trim() === ''
  ) {
    throw new HttpError(401, 'Authentication session is invalid');
  }
  return {userId, sessionId: payload.sessionId,};
}

export async function authenticateRequest(req, _res, next) {
  try {
    const authorization = req.get('authorization');
    let userId;
    let sessionId;
    if (authorization?.startsWith('Bearer ')) {
      const verified = verifyJwt(
      authorization.slice(7).trim());
      userId =verified.userId;
      sessionId= verified.sessionId;

    } else if (process.env.NODE_ENV !== 'production' && req.get('x-user-id')) {
      // Development-only bridge until the existing frontend auth flow is API-backed.
      userId = req.get('x-user-id').trim();
    } else {
      throw new HttpError(401, 'Authentication required');
    }

    const result = await pool.query(
      `SELECT u.user_id, 
      u.emp_id, 
      u.user_name, 
      u.mobile, 
      u.email, 
      u.user_type,
      u.active_session_id,
      COALESCE(
      array_agg(up.permission_code) FILTER (WHERE up.permission_code IS NOT NULL), '{}') AS permissions
         FROM users u LEFT JOIN user_permissions up ON up.user_id = u.user_id
        WHERE u.user_id = $1 OR u.emp_id = $1 GROUP BY u.user_id`, [userId],
    );
    if (result.rowCount === 0) throw new HttpError(401, 'Authenticated user not found');
    const dbUser = result.rows[0];
    if(
      sessionId && 
      dbUser.active_session_id != sessionId
    ){
      throw new HttpError(
        401,
        'Your account was logged in from another session.'
      );
    }
    req.user = dbUser;
    next();
  } catch (error) { next(error); }
}
