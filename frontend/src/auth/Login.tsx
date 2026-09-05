import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import OAuthButton from '../components/OAuthButton';
import { login } from '../services/auth.api';
import { useAuth } from '../context/AuthContext';
import { getPortalPath } from '../config/roles';
import type { Role } from '../types';

const DEMO_ACCOUNTS = [
  { email: 'sales@dealflow.demo', role: 'SALES_REP', label: 'Sales Rep', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { email: 'manager@dealflow.demo', role: 'MANAGER_ADMIN', label: 'Manager / Admin', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { email: 'ops@dealflow.demo', role: 'OPS_FINANCE', label: 'Ops / Finance', color: 'bg-green-50 border-green-200 text-green-800' },
  { email: 'customer@dealflow.demo', role: 'CUSTOMER', label: 'Customer', color: 'bg-orange-50 border-orange-200 text-orange-800' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const hasOAuth = true;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login({ email, password });
      authLogin(data.accessToken, data.refreshToken, data.user);
      const redirectPath = getPortalPath(data.user.role as Role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(demoEmail: string) {
    setError('');
    setLoading(true);
    setEmail(demoEmail);
    setPassword('demo1234');

    try {
      const data = await login({ email: demoEmail, password: 'demo1234' });
      authLogin(data.accessToken, data.refreshToken, data.user);
      const redirectPath = getPortalPath(data.user.role as Role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed');
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider: string) {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/${provider}`;
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" required />

        <Button type="submit" loading={loading}>Sign In</Button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500"><Link to="/forgot-password" className="font-medium text-gray-900 no-underline hover:underline">Forgot password?</Link></p>

      {hasOAuth && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-gray-400 before:flex-1 before:border-b before:border-gray-100 after:flex-1 after:border-b after:border-gray-100"><span>or</span></div>
          <div className="flex flex-col gap-2.5">
            <OAuthButton provider="google" onClick={() => handleOAuth("google")} />
            <OAuthButton provider="github" onClick={() => handleOAuth("github")} />
          </div>
        </>
      )}

      {/* Demo Accounts Section */}
      <div className="mt-6 border-t border-gray-100 pt-5">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">Demo Accounts</p>
        <div className="flex flex-col gap-2">
          {DEMO_ACCOUNTS.map((demo) => (
            <button
              key={demo.email}
              onClick={() => handleDemoLogin(demo.email)}
              disabled={loading}
              className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors hover:opacity-80 disabled:opacity-50 ${demo.color}`}
            >
              <span className="font-medium">{demo.label}</span>
              <span className="text-xs opacity-70">{demo.email}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-gray-400">Password: demo1234</p>
      </div>

      <p className="mt-5 text-center text-sm text-gray-500">Don't have an account? <Link to="/register" className="font-medium text-gray-900 no-underline hover:underline">Sign up</Link></p>
    </AuthLayout>
  );
}
