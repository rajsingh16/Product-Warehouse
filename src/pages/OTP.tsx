import { ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '../components/common/Button';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const RESEND_SECONDS = 30;

export function OTP() {
  const { verifyOTP, resendOTP, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const pending = authService.getPendingAuth();

  useEffect(() => {
    if (!pending && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [pending, isAuthenticated, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!pending) {
    return null;
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await verifyOTP(otp);
    if (result.success) {
      showToast('Login successful.');
      navigate('/dashboard');
    } else {
      setError(result.error ?? 'Invalid OTP. Please try again.');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    const result = await resendOTP();
    if (result.success) {
      setCountdown(RESEND_SECONDS);
      showToast('A new verification code has been sent.', 'info');
    } else {
      setError(result.error ?? 'Failed to resend OTP.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-slate-800">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Verify OTP</h1>
          <p className="mt-2 text-sm text-slate-600">
            A verification code has been sent to your registered WhatsApp number ending in{' '}
            <strong>{pending.maskedPhone}</strong>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label htmlFor="otp" className="mb-1.5 block text-sm font-medium text-slate-700">
              Enter OTP
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-center text-lg tracking-widest focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="000000"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Verify OTP
          </Button>
        </form>

        <div className="mt-4 text-center">
          {countdown > 0 ? (
            <p className="text-sm text-slate-500">Resend OTP in {countdown}s</p>
          ) : (
            <button
              onClick={handleResend}
              className="text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline"
            >
              Resend OTP
            </button>
          )}
        </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
