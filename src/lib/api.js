import { getToken, clearToken } from './auth.js';

// --------------------------------------------------------------------------
// A small wrapper around fetch() so every staff-only page doesn't repeat
// the same "attach the token, handle 401" logic. Any admin page now calls
// apiFetch('/api/whatever') instead of raw fetch() + manual headers.
// --------------------------------------------------------------------------

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
    window.location.href = '/login'; // hard redirect - simplest reliable option here
    throw new Error('Session expired.');
  }

  return res;
}

export { API_URL };
