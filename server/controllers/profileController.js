import bcrypt from 'bcrypt';

import { HttpError } from '../utils/http.js';

import * as profileRepository from '../repositories/profileRepository.js';

const SALT_ROUNDS = 12;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const profileController = {
  async getProfile(req, res) {
    const userId = req.user.user_id;
    const profile = await profileRepository.getProfile(userId);

    if (!profile) {
      throw new HttpError(404, 'User not found.');
    }

    res.json({
      success: true,
      data: profile,
    });
  },

  // Only userName, mobile and email are read from the body.
  // Anything else is ignored.
  async updateProfile(req, res) {
    const userName = String(req.body.userName ?? '').trim();
    const mobile = String(req.body.mobile ?? '').trim();
    const email = String(req.body.email ?? '').trim();

    if (!userName) {
      throw new HttpError(400, 'Name is required.');
    }

    if (email && !EMAIL_RE.test(email)) {
      throw new HttpError(400, 'Enter a valid email address.');
    }

    if (mobile && !/^[0-9+\-\s()]{7,20}$/.test(mobile)) {
      throw new HttpError(400, 'Enter a valid mobile number.');
    }

    const updated = await profileRepository.updateProfile(
      req.user.user_id,
      {
        userName,
        mobile,
        email,
      }
    );

    if (!updated) {
      throw new HttpError(404, 'User not found.');
    }

    res.json({
      success: true,
      data: updated,
      message: 'Profile updated successfully.',
    });
  },

  async changePassword(req, res) {
    const { currentPassword, newPassword } = req.body || {};

    // Always get the user ID from the authenticated session.
    // Never trust a userId sent from the frontend.
    const userId = req.user.user_id;

    if (typeof currentPassword !== 'string' || !currentPassword) {
      throw new HttpError(400, 'Current password is required.');
    }

    if (typeof newPassword !== 'string' || !newPassword) {
      throw new HttpError(400, 'New password is required.');
    }

    if (newPassword.length < 8) {
      throw new HttpError(
        400,
        'Password must be at least 8 characters.'
      );
    }

    if (newPassword.length > 72) {
      throw new HttpError(
        400,
        'Password must be 72 characters or fewer.'
      );
    }

    const hash = await profileRepository.getPasswordHash(userId);

    if (!hash) {
      throw new HttpError(404, 'User not found.');
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      hash
    );

    if (!currentPasswordMatches) {
      throw new HttpError(
        400,
        'Current password is incorrect.'
      );
    }

    const sameAsCurrent = await bcrypt.compare(
      newPassword,
      hash
    );

    if (sameAsCurrent) {
      throw new HttpError(
        400,
        'New password must be different from your current password.'
      );
    }

    const newPasswordHash = await bcrypt.hash(
      newPassword,
      SALT_ROUNDS
    );

    await profileRepository.updatePassword(
      userId,
      newPasswordHash
    );

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  },
};
