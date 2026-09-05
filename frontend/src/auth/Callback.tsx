import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../services/auth.api';

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

      // Fetch full user context from backend
      getCurrentUser()
        .then(data => {
          login(token, refreshToken, data.user, data.portal, data.navigation, data.permissions);
          const redirectPath = data.portal?.route || '/login';
          navigate(redirectPath, { replace: true });
        })
        .catch(() => {
          navigate('/login', { replace: true });
        });
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
