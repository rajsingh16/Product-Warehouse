import { HttpError } from '../utils/http.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import * as profileRepository from '../repositories/profileRepository.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getProfile(req, res) {
  const profile = await profileRepository.getProfile(req.user.user_id);
  if (!profile) throw new HttpError(404, 'User not found.');
  res.json({ success: true, data: profile });
}

// Only userName, mobile and email are read from the body; anything else is ignored.
async function updateProfile(req, res) {
  const userName = String(req.body?.userName ?? '').trim();
  const mobile = String(req.body?.mobile ?? '').trim();
  const email = String(req.body?.email ?? '').trim();

  if (!userName) throw new HttpError(400, 'Name is required.');
  if (email && !EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  if (mobile && !/^[0-9+\-\s()]{7,20}$/.test(mobile)) throw new HttpError(400, 'Enter a valid mobile number.');

  const updated = await profileRepository.updateProfile(req.user.user_id, { userName, mobile, email });
  if (!updated) throw new HttpError(404, 'User not found.');
  res.json({ success: true, data: updated });
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  const userId = req.user.user_id; // never from the request body

  if (typeof currentPassword !== 'string' || !currentPassword) {
    throw new HttpError(400, 'Current password is required.');
  }
  if (typeof newPassword !== 'string' || !newPassword) {
    throw new HttpError(400, 'New password is required.');
  }
  if (newPassword.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  if (newPassword.length > 72) throw new HttpError(400, 'Password must be 72 characters or fewer.');

  const stored = await profileRepository.getPasswordHash(userId);
  if (!stored) throw new HttpError(404, 'User not found.');

  // Works for both legacy plaintext and bcrypt-hashed accounts
  if (!(await verifyPassword(currentPassword, stored))) {
    throw new HttpError(400, 'Current password is incorrect.');
  }
  if (await verifyPassword(newPassword, stored)) {
    throw new HttpError(400, 'New password must be different from your current password.');
  }

  // Always stored as a bcrypt hash, which also upgrades legacy plaintext accounts
  await profileRepository.updatePassword(userId, await hashPassword(newPassword));
  res.json({ success: true, data: { changed: true } });
}

export const profileController = { getProfile, updateProfile, changePassword };