import { getToken, clearToken } from './auth.js';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Session expired.');
  }
  return res;
}