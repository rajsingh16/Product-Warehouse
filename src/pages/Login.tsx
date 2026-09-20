import { Warehouse } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';

export function Login() {
  const { login, replaceSession, isAuthenticated, isLoading, } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  const [pendingCredentials, setPendingCredentials] = useState<{
    userId: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    const reason = sessionStorage.getItem('pw_session_expired_reason');
    if (!reason) return;
    sessionStorage.removeItem('pw_session_expired_reason');
    setSessionMessage(
      reason === 'idle'
        ? 'Session Expired. You have been logged out because you were inactive for 30 seconds.'
        : 'Session Expired. You have been logged out because you left the application tab.',
    );
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    const result = await login(userId, password);
  
    if (result.success) {
      navigate('/dashboard');
    } else if (result.requiresSessionConfirmation) {
      setPendingCredentials({
        userId,
        password,
      });
  
      setShowSessionWarning(true);
    } else {
      setError(result.error ?? 'Invalid User ID or Password.');
    }
  };
  const handleContinueSession = async () => {
    if (!pendingCredentials) return;
  
    setError('');
  
    const result = await replaceSession(
      pendingCredentials.userId,
      pendingCredentials.password
    );
  
    if (result.success) {
      setShowSessionWarning(false);
      setPendingCredentials(null);
      navigate('/dashboard');
    } else {
      setError(
        result.error ?? 'Unable to continue login.'
      );
    }
  };
  const handleCancelSession = () => {
    setShowSessionWarning(false);
    setPendingCredentials(null);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-100">
      {/* Scrollable main area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center px-3 py-4 sm:px-4 sm:py-6 md:py-8">
          <div
            className="
              w-full max-w-md
              rounded-lg border border-slate-200 bg-white shadow-sm
              p-5 sm:p-6 md:p-8
              max-h-[calc(100dvh-2rem)]
              overflow-y-auto
            "
          >
            {/* Header */}
            <div className="mb-6 text-center sm:mb-8">
              <div
                className="
                  mx-auto mb-3 flex h-12 w-12
                  items-center justify-center rounded-lg
                  bg-slate-800
                  sm:mb-4 sm:h-14 sm:w-14
                "
              >
                <Warehouse className="h-6 w-6 text-white sm:h-7 sm:w-7" />
              </div>
  
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                ShanConnects
              </h1>
  
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Sign in to your account
              </p>
            </div>
  
            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {sessionMessage && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
                  {sessionMessage}
                </div>
              )}
  
              {/* User ID */}
              <div>
                <label
                  htmlFor="userId"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  User ID
                </label>
  
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="
                    w-full rounded-md border border-slate-300
                    px-3 py-2 text-sm
                    focus:border-slate-500 focus:outline-none
                    focus:ring-1 focus:ring-slate-500
                  "
                  placeholder="Enter your user ID"
                  autoComplete="username"
                />
              </div>
  
              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>
  
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    w-full rounded-md border border-slate-300
                    px-3 py-2 text-sm
                    focus:border-slate-500 focus:outline-none
                    focus:ring-1 focus:ring-slate-500
                  "
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
  
              {error && (
                <p className="text-sm text-red-600">
                  {error}
                </p>
              )}
  
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Login
              </Button>
            </form>
  
            {/* Existing session warning */}
            {showSessionWarning && (
              <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 sm:p-4">
                <h3 className="text-sm font-semibold text-amber-900">
                  Account Already Logged In
                </h3>
  
                <p className="mt-2 text-xs text-amber-800 sm:text-sm">
                  This account is already logged in from another session.
                  If you continue, the existing session will be logged out.
                </p>
  
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:flex-1"
                    onClick={handleCancelSession}
                  >
                    Cancel
                  </Button>
  
                  <Button
                    type="button"
                    className="w-full sm:flex-1"
                    isLoading={isLoading}
                    onClick={handleContinueSession}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  
      <Footer />
    </div>
  );
}