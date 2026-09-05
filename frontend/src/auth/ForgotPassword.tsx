import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { forgotPassword } from '../services/auth.api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We sent a password reset link to your email address.">
        <p className="mt-5 text-center text-sm text-gray-500">
          <Link to="/login" className="font-medium text-gray-900 no-underline hover:underline">Back to sign in</Link>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password" subtitle="Enter your email to receive a reset link">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

        <Button type="submit" loading={loading}>Send reset link</Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        <Link to="/login" className="font-medium text-gray-900 no-underline hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
