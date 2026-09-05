import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import OAuthButton from '../components/OAuthButton';
import { register } from '../services/auth.api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const hasOAuth = true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password });
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider: string) {
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  }

  return (
    <AuthLayout title="Create account" subtitle="Get started with your free account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />

        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required />

        <Button type="submit" loading={loading}>Create account</Button>
      </form>

      {hasOAuth && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-gray-400 before:flex-1 before:border-b before:border-gray-100 after:flex-1 after:border-b after:border-gray-100"><span>or</span></div>
          <div className="flex flex-col gap-2.5">
            <OAuthButton provider="google" onClick={() => handleOAuth("google")} />
            <OAuthButton provider="github" onClick={() => handleOAuth("github")} />
          </div>
        </>
      )}

      <p className="mt-5 text-center text-sm text-gray-500">
        Already have an account? <Link to="/login" className="font-medium text-gray-900 no-underline hover:underline">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
