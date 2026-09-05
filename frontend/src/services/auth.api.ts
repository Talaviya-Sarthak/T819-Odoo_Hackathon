import type { LoginResponse, RegisterResponse, VerifyEmailResponse } from '../types';

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

export async function register({ name, email, password }: { name: string; email: string; password: string }): Promise<RegisterResponse> {
  return request<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
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

export async function refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
  return request<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
  });
}

export async function logout(): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<{ user: { id: string; email: string; name?: string; avatar_url?: string } }> {
  return request('/api/auth/me');
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
