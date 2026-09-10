import { DEMO_OTP, mockUsers } from '../data/mockData';
import type { AuthUser, PendingAuth } from '../types';

const AUTH_KEY = 'pw_auth';
const PENDING_AUTH_KEY = 'pw_pending_auth';
const OTP_RESEND_SECONDS = 30;

function stripPassword(user: (typeof mockUsers)[0]): AuthUser {
  const { password: _, ...authUser } = user;
  return authUser;
}

export const authService = {
  async login(userId: string, password: string): Promise<{ success: true; pending: PendingAuth } | { success: false; error: string }> {
    await delay(400);

    const user = mockUsers.find((u) => u.userId === userId && u.password === password);
    if (!user) {
      return { success: false, error: 'Invalid User ID or Password.' };
    }

    const authUser = stripPassword(user);
    const now = Date.now();
    const pending: PendingAuth = {
      user: authUser,
      otp: DEMO_OTP,
      expiresAt: now + 5 * 60 * 1000,
      resendAvailableAt: now + OTP_RESEND_SECONDS * 1000,
    };

    sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pending));
    console.info('[ShanConnects] Demo OTP:', DEMO_OTP);

    return { success: true, pending };
  },

  async verifyOTP(otp: string): Promise<{ success: true; user: AuthUser } | { success: false; error: string }> {
    await delay(300);

    const raw = sessionStorage.getItem(PENDING_AUTH_KEY);
    if (!raw) {
      return { success: false, error: 'Session expired. Please login again.' };
    }

    const pending: PendingAuth = JSON.parse(raw);

    if (Date.now() > pending.expiresAt) {
      sessionStorage.removeItem(PENDING_AUTH_KEY);
      return { success: false, error: 'OTP expired. Please login again.' };
    }

    if (otp.trim() !== pending.otp) {
      return { success: false, error: 'Invalid OTP. Please try again.' };
    }

    sessionStorage.removeItem(PENDING_AUTH_KEY);
    localStorage.setItem(AUTH_KEY, JSON.stringify(pending.user));

    return { success: true, user: pending.user };
  },

  async resendOTP(): Promise<{ success: true; pending: PendingAuth } | { success: false; error: string }> {
    await delay(300);

    const raw = sessionStorage.getItem(PENDING_AUTH_KEY);
    if (!raw) {
      return { success: false, error: 'Session expired. Please login again.' };
    }

    const existing: PendingAuth = JSON.parse(raw);
    const now = Date.now();

    if (now < existing.resendAvailableAt) {
      return { success: false, error: 'Please wait before requesting a new OTP.' };
    }

    const pending: PendingAuth = {
      ...existing,
      otp: DEMO_OTP,
      expiresAt: now + 5 * 60 * 1000,
      resendAvailableAt: now + OTP_RESEND_SECONDS * 1000,
    };

    sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pending));
    console.info('[ShanConnects] Demo OTP (resent):', DEMO_OTP);

    return { success: true, pending };
  },

  getPendingAuth(): PendingAuth | null {
    const raw = sessionStorage.getItem(PENDING_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  },

  getStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  },

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(PENDING_AUTH_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getStoredUser();
  },
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Future: POST /api/auth/login, POST /api/auth/verify-otp, POST /api/auth/resend-otp
