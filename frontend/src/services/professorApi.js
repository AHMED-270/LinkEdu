import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) return envUrl;
  
  const isProduction = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isProduction) return 'https://backendlinkededu-main-oied8k.free.laravel.cloud';
  
  const host = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
  return `http://${host}:8000`;
};

const apiBaseUrl = getApiBaseUrl();
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

export async function professorPut(path, data) {
  if (!getStoredToken()) {
    await withCsrf();
  }

  const response = await axios.put(apiBaseUrl + path, data, {
    withCredentials: true,
    withXSRFToken: true,
    headers: buildHeaders({ Accept: 'application/json' }),
  });
  return response.data;
}

export async function professorDelete(path) {
  if (!getStoredToken()) {
    await withCsrf();
  }

  const response = await axios.delete(apiBaseUrl + path, {
    withCredentials: true,
    withXSRFToken: true,
    headers: buildHeaders({ Accept: 'application/json' }),
  });
  return response.data;
}
