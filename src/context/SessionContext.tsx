import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export const SESSION_IDLE_TIMEOUT = 30 * 60 * 1000;

interface SessionContextValue {
  secondsRemaining: number;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [secondsRemaining, setSecondsRemaining] = useState(SESSION_IDLE_TIMEOUT / 1000);

  useEffect(() => {
    if (!isAuthenticated) return;
    const recordActivity = () => setLastActivity(Date.now());
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((event) => window.addEventListener(event, recordActivity, { passive: true }));
    return () => events.forEach((event) => window.removeEventListener(event, recordActivity));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const expire = (reason: 'idle' | 'tab') => {
      sessionStorage.setItem('pw_session_expired_reason', reason);
      logout();
      navigate('/login', { replace: true });
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') expire('tab');
    };

    document.addEventListener('visibilitychange', handleVisibility);
    const timer = window.setInterval(() => {
      const remainingMs = Math.max(0, SESSION_IDLE_TIMEOUT - (Date.now() - lastActivity));
      setSecondsRemaining(Math.ceil(remainingMs / 1000));
      if (remainingMs <= 0) expire('idle');
    }, 250);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(timer);
    };
  }, [isAuthenticated, lastActivity, logout, navigate]);

  const value = useMemo(() => ({ secondsRemaining }), [secondsRemaining]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) return { secondsRemaining: SESSION_IDLE_TIMEOUT / 1000 };
  return ctx;
}
