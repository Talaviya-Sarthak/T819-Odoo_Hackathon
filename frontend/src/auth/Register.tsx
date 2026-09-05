import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import OAuthButton from '../components/OAuthButton';
import { register, getPublicRoles } from '../services/auth.api';
import type { RoleOption } from '../types';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(true);
  const navigate = useNavigate();

  const hasOAuth = true;

  useEffect(() => {
    async function fetchRoles() {
      try {
        const data = await getPublicRoles();
        setRoles(data.roles || []);
        if (data.roles && data.roles.length > 0) {
          setRoleId(data.roles[0].id);
        }
      } catch {
        setError('Failed to load registration options');
      } finally {
        setRolesLoading(false);
      }
    }
    fetchRoles();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ name, email, password, roleId: roleId || undefined });
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  function handleOAuth(provider: string) {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/${provider}`;
  }

  return (
    <AuthLayout title="Create account" subtitle="Get started with your free account">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />

        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />

        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required />

        {/* Dynamic role selector - fetched from backend */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Select Role</label>
          {rolesLoading ? (
            <div className="h-10 animate-pulse rounded-md border border-gray-200 bg-gray-50" />
          ) : (
            <select
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
            >
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.displayName}
                </option>
              ))}
            </select>
          )}
        </div>

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
