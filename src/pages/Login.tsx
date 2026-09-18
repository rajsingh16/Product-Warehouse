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
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-800">
            <Warehouse className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">ShanConnects</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {sessionMessage && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {sessionMessage}
            </div>
          )}
          <div>
            <label htmlFor="userId" className="mb-1.5 block text-sm font-medium text-slate-700">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Enter your user ID"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Login
          </Button>
        </form>
        {showSessionWarning && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-900">
              Account Already Logged In
            </h3>

            <p className="mt-2 text-sm text-amber-800">
              This account is already logged in from another session.
              If you continue, the existing session will be logged out.
            </p>

            <div className="mt-4 flex gap-3">
              <Button
                type="button"
                variant ="secondary"
                className="flex-1"
                onClick={handleCancelSession}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="flex-1"
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
      <Footer />
    </div>
  );
}
