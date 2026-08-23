const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function parseResponse(response) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error?.message || 'Something went wrong');
    error.code = data?.error?.code;
    error.status = response.status;
    throw error;
  }

  return data;
}

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

  return parseResponse(response);
}

// For multipart/form-data requests (e.g. photo uploads) - don't set
// Content-Type manually, the browser needs to add its own multipart
// boundary, which it only does when it sets the header itself.
async function requestFormData(path, { method = 'POST', body, token } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { method, headers, body });

  return parseResponse(response);
}

export function register({ name, email, password }) {
  return request('/api/auth/register', { method: 'POST', body: { name, email, password } });
}

export function login({ email, password }) {
  return request('/api/auth/login', { method: 'POST', body: { email, password } });
}

export function createComplaint({ category, description, photo }, token) {
  const formData = new FormData();
  formData.append('category', category);
  formData.append('description', description);
  if (photo) {
    formData.append('photo', photo);
  }

  return requestFormData('/api/complaints', { method: 'POST', body: formData, token });
}
