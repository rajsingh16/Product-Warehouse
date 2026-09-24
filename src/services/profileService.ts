import { apiRequest } from './apiClient';
import type { ProfileUser, UpdateProfileInput, ChangePasswordInput } from '../types';

export const profileService = {
  async getProfile(): Promise<ProfileUser> {
    return apiRequest<ProfileUser>('/api/profile');
  },

  async updateProfile(input: UpdateProfileInput): Promise<ProfileUser> {
    return apiRequest<ProfileUser>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const body: ChangePasswordInput = { currentPassword, newPassword };
    await apiRequest<{ success: boolean; message?: string }>('/api/profile/password', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
};
