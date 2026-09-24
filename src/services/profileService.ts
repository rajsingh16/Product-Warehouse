import { apiRequest } from './apiClient';
import type { ProfileUser, UpdateProfileInput, ChangePasswordInput } from '../types';

export const profileService = {
  getProfile: () => apiRequest<ProfileUser>('/api/profile'),

  updateProfile: (input: UpdateProfileInput) =>
    apiRequest<ProfileUser>('/api/profile', { method: 'PUT', body: JSON.stringify(input) }),

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const body: ChangePasswordInput = { currentPassword, newPassword };
    await apiRequest<{ changed: boolean }>('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};