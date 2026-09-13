import { Router } from 'express';
import { beginLogin, resendOtp, verifyOtp } from '../services/authService.js';
import { asyncHandler, requiredString } from '../utils/http.js';

const router = Router();
router.post('/login', asyncHandler(async (req, res) => res.json({ success: true, data: await beginLogin(requiredString(req.body.userId, 'userId'), requiredString(req.body.password, 'password'), req.ip) })));
router.post('/verify-otp', asyncHandler(async (req, res) => res.json({ success: true, data: await verifyOtp(requiredString(req.body.challengeId, 'challengeId'), requiredString(req.body.otp, 'otp')) })));
router.post('/resend-otp', asyncHandler(async (req, res) => res.json({ success: true, data: await resendOtp(requiredString(req.body.challengeId, 'challengeId')) })));
router.post('/logout', (_req, res) => res.json({ success: true, data: { loggedOut: true } }));
export default router;
