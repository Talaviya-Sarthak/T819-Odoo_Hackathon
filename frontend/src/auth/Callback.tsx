import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refresh');

    if (token && refreshToken) {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      window.location.href = '/dashboard';
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-gray-900" />
      <p>Completing authentication...</p>
    </div>
  );
}
