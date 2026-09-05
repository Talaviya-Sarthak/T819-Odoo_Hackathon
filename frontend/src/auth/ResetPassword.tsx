import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { resetPassword } from '../services/auth.api';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword({ token: token || '', password });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Reset password" subtitle="Enter your new password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <Input label="New Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required />

        <Button type="submit" loading={loading}>Reset password</Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-gray-900 no-underline hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
