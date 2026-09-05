import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Button from '../components/Button';
import { verifyEmail, resendOtp } from '../services/auth.api';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as { email?: string })?.email || '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await verifyEmail({ email, otp });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await resendOtp({ email });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resend failed');
    }
  }

  return (
    <AuthLayout title="Verify your email" subtitle={`We sent a verification code to ${email}`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="flex justify-center">
          <input
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full rounded-md border border-gray-200 p-3 text-center font-mono text-2xl tracking-[8px] outline-none focus:border-gray-900"
            required
          />
        </div>

        <Button type="submit" loading={loading}>Verify</Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {resent ? (
          <span className="text-green-600">Code resent!</span>
        ) : (
          <button type="button" className="font-medium text-gray-900 no-underline hover:underline" onClick={handleResend}>Resend code</button>
        )}
      </p>
    </AuthLayout>
  );
}
