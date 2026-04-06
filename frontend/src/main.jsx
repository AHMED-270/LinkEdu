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

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('linkedu_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;
// Dynamically use the same hostname (localhost vs 127.0.0.1) as the browser to prevent CORS/cookie drops
const host = window.location.hostname;
axios.defaults.baseURL = import.meta.env.VITE_API_URL ?? `http://${host}:8000`;
axios.defaults.headers.common['Accept'] = 'application/json';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
