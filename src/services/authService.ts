import { apiRequest } from './apiClient';
import type { AuthUser, PendingAuth } from '../types';

const AUTH_KEY = 'pw_auth';
const TOKEN_KEY = 'pw_access_token';
const PENDING_AUTH_KEY = 'pw_pending_auth';

export const authService = {
  async login(
    userId: string,
    password: string
  ): Promise<
    | { success: true; user: AuthUser }
    | {
        success: false;
        error: string;
        requiresSessionConfirmation?: boolean;
        message?: string;
        userId?: string;
        password?: string;
      }
  > {
    try {
      const result = await apiRequest<{
        token?: string;
        user?: AuthUser;
        requiresSessionConfirmation?: boolean;
        message?: string;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          password,
        }),
      });
  
      // Another session already exists
      if (result.requiresSessionConfirmation) {
        return {
          success: false,
          requiresSessionConfirmation: true,
          error:
            result.message ??
            'This account is already logged in from another session.',
          userId,
          password,
        };
      }
  
      // Normal successful login
      if (!result.token || !result.user) {
        return {
          success: false,
          error: 'Invalid login response.',
        };
      }
  
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify(result.user)
      );
  
      localStorage.setItem(
        TOKEN_KEY,
        result.token
      );
  
      return {
        success: true,
        user: result.user,
      };
  
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to login.',
      };
    }
  },
  async replaceSession(
    userId: string,
    password: string
  ): Promise<
    { success: true; user: AuthUser } |
    { success: false; error: string }
  > {
    try {
      const result = await apiRequest<{
        token: string;
        user: AuthUser;
      }>('/api/auth/replace-session', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          password,
        }),
      });
  
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify(result.user)
      );
  
      localStorage.setItem(
        TOKEN_KEY,
        result.token
      );
  
      return {
        success: true,
        user: result.user,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to replace session.',
      };
    }
  },
  async verifyOTP(otp: string): Promise<{ success: true; user: AuthUser } | { success: false; error: string }> {
    const pending = this.getPendingAuth(); if (!pending) return { success: false, error: 'Session expired. Please login again.' };
    try { const result = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ challengeId: pending.challengeId, otp }) }); localStorage.setItem(AUTH_KEY, JSON.stringify(result.user)); localStorage.setItem(TOKEN_KEY, result.token); sessionStorage.removeItem(PENDING_AUTH_KEY); return { success: true, user: result.user }; }
    catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Invalid verification code.' }; }
  },
  async resendOTP(): Promise<{ success: true; pending: PendingAuth } | { success: false; error: string }> {
    const pending = this.getPendingAuth(); if (!pending) return { success: false, error: 'Session expired. Please login again.' };
    try { const next = await apiRequest<PendingAuth>('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ challengeId: pending.challengeId }) }); sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(next)); return { success: true, pending: next }; }
    catch (error) { return { success: false, error: error instanceof Error ? error.message : 'Failed to resend OTP.' }; }
  },
  getPendingAuth(): PendingAuth | null { const raw = sessionStorage.getItem(PENDING_AUTH_KEY); if (!raw) return null; try { return JSON.parse(raw) as PendingAuth; } catch { return null; } },
  getStoredUser(): AuthUser | null { const raw = localStorage.getItem(AUTH_KEY); if (!raw) return null; try { return JSON.parse(raw) as AuthUser; } catch { return null; } },
  async logout(): Promise<void> { 
    try{
      await apiRequest('/api/auth/logout',{
        method: 'POST',
      });
    }catch{

    }
    localStorage.removeItem(AUTH_KEY); localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(PENDING_AUTH_KEY);
   },
  isAuthenticated(): boolean { return !!this.getStoredUser(); },
};
