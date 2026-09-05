import type { LoginResponse, RegisterResponse, VerifyEmailResponse, User, RoleOption } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export async function getPublicRoles(): Promise<{ roles: RoleOption[] }> {
  return request('/api/auth/roles');
}

export async function register({ name, email, password, roleId }: { name: string; email: string; password: string; roleId?: string }): Promise<RegisterResponse> {
  return request<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, roleId }),
  });
}

export async function verifyEmail({ email, otp }: { email: string; otp: string }): Promise<VerifyEmailResponse> {
  return request<VerifyEmailResponse>('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function resendOtp({ email }: { email: string }): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function login({ email, password }: { email: string; password: string }): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string; user: User; portal?: { name: string; route: string } | null; navigation?: { name: string; label: string; path: string; icon: string }[]; permissions?: string[] }> {
  return request('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
  });
}

export async function logout(): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<{ user: User; portal?: { name: string; route: string } | null; navigation?: { name: string; label: string; path: string; icon: string }[]; permissions?: string[] }> {
  return request('/api/auth/me');
}

export async function getNavigation(): Promise<{ navigation: { name: string; label: string; path: string; icon: string }[]; portal: { name: string; route: string } | null; permissions: string[] }> {
  return request('/api/navigation');
}

export async function forgotPassword({ email }: { email: string }): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword({ token, password }: { token: string; password: string }): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function getAdminRoles(): Promise<{ roles: { id: string; name: string; display_name: string; description: string; is_active: boolean; is_self_registerable: boolean }[] }> {
  return request('/api/management/roles');
}

export async function adminCreateUser({ name, email, password, roleId, customerId }: { name: string; email: string; password: string; roleId: string; customerId?: string }): Promise<{ user: User }> {
  return request('/api/management/users', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, roleId, customerId }),
  });
}
