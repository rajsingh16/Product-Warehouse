import { Router } from 'express';
import { beginLogin, replaceSession, resendOtp, verifyOtp, logoutSession } from '../services/authService.js';
import { authenticateRequest } from '../middleware/auth.js';
import { asyncHandler, requiredString } from '../utils/http.js';
import { pool } from '../db/pool.js';

const router = Router();
router.post('/login', asyncHandler(async (req, res) => res.json({ success: true, data: await beginLogin(requiredString(req.body.userId, 'userId'), requiredString(req.body.password, 'password'), req.ip) })));
router.post('/verify-otp', asyncHandler(async (req, res) => res.json({ success: true, data: await verifyOtp(requiredString(req.body.challengeId, 'challengeId'), requiredString(req.body.otp, 'otp')) })));
router.post('/resend-otp', asyncHandler(async (req, res) => res.json({ success: true, data: await resendOtp(requiredString(req.body.challengeId, 'challengeId')) })));
router.post(
    '/logout',
    authenticateRequest,
    asyncHandler(async (req, res) => {
      const userId = req.user.user_id;
  
      await pool.query(
        `
        UPDATE users
        SET active_session_id = NULL
        WHERE user_id = $1
        `,
        [userId]
      );
  
      res.json({
        success: true,
        data: {
          loggedOut: true,
        },
      });
    })
  );
router.post(
    '/replace-session',
    asyncHandler(async (req, res) => {
      res.json({
        success: true,
        data: await replaceSession(
          requiredString(req.body.userId, 'userId'),
          requiredString(req.body.password, 'password')
        ),
      });
    })
  );
export default router;
