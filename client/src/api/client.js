const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Something went wrong');
    error.code = data?.error?.code;
    error.status = response.status;
    throw error;
  }

  return data;
}

export function register({ name, email, password }) {
  return request('/api/auth/register', { method: 'POST', body: { name, email, password } });
}

export function login({ email, password }) {
  return request('/api/auth/login', { method: 'POST', body: { email, password } });
}
