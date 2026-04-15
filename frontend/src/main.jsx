import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@fontsource/poppins/300.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import axios from 'axios'
import './index.css'
import './styles/prof-borderless.css'
import App from './App.jsx'

const LOCAL_API_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

const rewriteLocalApiHost = (value) => {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) {
    return value;
  }

  const browserHost = window.location.hostname;
  if (LOCAL_API_HOSTS.has(browserHost)) {
    return value;
  }

  try {
    const parsed = new URL(value);
    if (!LOCAL_API_HOSTS.has(parsed.hostname)) {
      return value;
    }

    parsed.hostname = browserHost;
    return parsed.toString();
  } catch {
    return value;
  }
};

const resolveApiBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_URL?.trim();

  if (!envBaseUrl) {
    return `http://${window.location.hostname}:8000`;
  }

  const normalized = rewriteLocalApiHost(envBaseUrl);
  return normalized.replace(/\/$/, '');
};

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('linkedu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.baseURL) {
    config.baseURL = rewriteLocalApiHost(config.baseURL);
  }

  if (config.url) {
    config.url = rewriteLocalApiHost(config.url);
  }

  return config;
});


axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
axios.defaults.baseURL = resolveApiBaseUrl();
axios.defaults.headers.common['Accept'] = 'application/json';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
