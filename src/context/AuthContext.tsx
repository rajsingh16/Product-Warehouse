import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/authService';
import { apiRequest } from '../services/apiClient';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string, password: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOTP: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    apiRequest<{ user_id: string; emp_id: string; user_name: string; mobile: string | null; email: string; user_type: 'Administrator' | 'User'; permissions: AuthUser['permissions'] }>('/api/me')
      .then((record) => setUser((current) => current ? { ...current, id: record.user_id, userId: record.user_id, employeeId: record.emp_id, name: record.user_name, email: record.email, whatsappLastDigits: record.mobile?.slice(-2) ?? current.whatsappLastDigits, userType: record.user_type, role: record.user_type === 'Administrator' ? 'Administrator' : 'Employee', permissions: record.permissions ?? [] } : current))
      .catch(() => { authService.logout(); setUser(null); });
  }, [user?.id]);

  const login = useCallback(async (userId: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login(userId, password);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (otp: string) => {
    setIsLoading(true);
    try {
      const result = await authService.verifyOTP(otp);
      if (!result.success) {
        return { success: false, error: result.error };
      }
      setUser(result.user);
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async () => {
    const result = await authService.resendOTP();
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      verifyOTP,
      resendOTP,
      logout,
    }),
    [user, isLoading, login, verifyOTP, resendOTP, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
