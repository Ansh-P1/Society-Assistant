const STORAGE_KEY = 'society_tracker_auth';

export function saveAuth({ token, user }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

export function getAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
