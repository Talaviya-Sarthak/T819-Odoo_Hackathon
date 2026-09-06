import type { LoginResponse } from '../types';
import { queryCache, type QueryCacheOptions } from './query-cache';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname
    ? `${window.location.protocol}//${window.location.hostname}:5000`
    : 'http://localhost:5000');

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token');

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Token refresh failed');

  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  return data.accessToken;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        headers['Authorization'] = `Bearer ${newToken}`;
        return fetch(`${API_URL}${endpoint}`, { ...options, headers, credentials: 'include' })
          .then((res) => res.json())
          .then((data) => {
            if (!data) throw new Error('Request failed');
            if (data.error) throw new Error(data.error);
            return data as T;
          });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await refreshAccessToken();
      processQueue(null, newToken);
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw new Error('Session expired');
    } finally {
      isRefreshing = false;
    }
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

/**
 * Auto-invalidates related query cache keys when a mutation succeeds
 */
function autoInvalidateCache(endpoint: string) {
  if (endpoint.includes('/api/quotations')) {
    queryCache.invalidate(['/api/quotations', '/api/reports', '/api/customer/quotations']);
  } else if (endpoint.includes('/api/orders')) {
    queryCache.invalidate(['/api/orders', '/api/quotations', '/api/fulfillments', '/api/reports', '/api/customer/orders']);
  } else if (endpoint.includes('/api/invoices')) {
    queryCache.invalidate(['/api/invoices', '/api/payments', '/api/orders', '/api/reports', '/api/customer/invoices']);
  } else if (endpoint.includes('/api/payments')) {
    queryCache.invalidate(['/api/payments', '/api/invoices', '/api/reports', '/api/customer/payments']);
  } else if (endpoint.includes('/api/inventory') || endpoint.includes('/api/warehouses')) {
    queryCache.invalidate(['/api/inventory', '/api/warehouses', '/api/reports']);
  } else if (endpoint.includes('/api/backorders')) {
    queryCache.invalidate(['/api/backorders', '/api/inventory', '/api/fulfillments']);
  } else if (endpoint.includes('/api/fulfillments')) {
    queryCache.invalidate(['/api/fulfillments', '/api/orders', '/api/inventory', '/api/backorders']);
  } else if (endpoint.includes('/api/customers')) {
    queryCache.invalidate(['/api/customers', '/api/quotations', '/api/orders']);
  } else if (endpoint.includes('/api/products')) {
    queryCache.invalidate(['/api/products']);
  } else if (endpoint.includes('/api/management/users')) {
    queryCache.invalidate(['/api/management/users']);
  } else if (endpoint.includes('/api/approvals')) {
    queryCache.invalidate(['/api/approvals', '/api/quotations', '/api/reports']);
  } else if (endpoint.includes('/api/subscriptions')) {
    queryCache.invalidate(['/api/subscriptions', '/api/billing-schedules', '/api/reports']);
  } else {
    const base = endpoint.split('?')[0] || endpoint;
    queryCache.invalidate([base]);
  }
}

export async function apiGet<T>(endpoint: string, options?: QueryCacheOptions): Promise<T> {
  return queryCache.fetch<T>(
    endpoint,
    (signal) => apiRequest<T>(endpoint, { method: 'GET', signal }),
    options
  );
}

export async function apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
  const result = await apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
  autoInvalidateCache(endpoint);
  return result;
}

export async function apiPut<T>(endpoint: string, body?: unknown): Promise<T> {
  const result = await apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
  autoInvalidateCache(endpoint);
  return result;
}

export async function apiPatch<T>(endpoint: string, body?: unknown): Promise<T> {
  const result = await apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
  autoInvalidateCache(endpoint);
  return result;
}

export async function apiDelete<T>(endpoint: string): Promise<T> {
  const result = await apiRequest<T>(endpoint, { method: 'DELETE' });
  autoInvalidateCache(endpoint);
  return result;
}

export async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: formData,
  });
}

export async function apiDownload(endpoint: string, fallbackFilename = 'download'): Promise<void> {
  const token = localStorage.getItem('accessToken');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errMessage = 'Download failed';
    try {
      const errJson = await response.json();
      errMessage = errJson.message || errJson.error || errMessage;
    } catch {}
    throw new Error(errMessage);
  }

  const disposition = response.headers.get('Content-Disposition');
  let filename = fallbackFilename;
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) filename = match[1];
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

