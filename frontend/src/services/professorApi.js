import axios from 'axios';

const browserHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const apiBaseUrl = import.meta.env.VITE_API_URL ?? `http://${browserHost}:8000`;
const AUTH_TOKEN_KEY = 'linkedu_token';

function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function buildHeaders(baseHeaders = {}) {
  const token = getStoredToken();

  if (!token) {
    return baseHeaders;
  }

  return {
    ...baseHeaders,
    Authorization: `Bearer ${token}`,
  };
}

async function withCsrf() {
  await axios.get(apiBaseUrl + '/sanctum/csrf-cookie', {
    withCredentials: true,
    withXSRFToken: true,
  });
}

export async function professorGet(path, params = {}) {
  const response = await axios.get(apiBaseUrl + path, {
    params,
    withCredentials: true,
    withXSRFToken: true,
    headers: buildHeaders({ Accept: 'application/json' }),
  });
  return response.data;
}

export async function professorPost(path, data, isForm = false) {
  if (!getStoredToken()) {
    await withCsrf();
  }

  const response = await axios.post(apiBaseUrl + path, data, {
    withCredentials: true,
    withXSRFToken: true,
    headers: buildHeaders({
      Accept: 'application/json',
      ...(isForm ? { 'Content-Type': 'multipart/form-data' } : {}),
    }),
  });
  return response.data;
}
