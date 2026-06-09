import axios from 'axios';

// Dynamic base URL: works on localhost, LAN IP, and production
function getBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { protocol, hostname, port } = window.location;
  // If served from port 5000 (SPA via Express), API is same origin
  if (port === '5000' || port === '') return '';
  // Dev server (port 3000) — use same hostname but port 5000
  return `${protocol}//${hostname}:5000`;
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function normalizeKeys(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (obj instanceof Date || obj instanceof RegExp || obj instanceof Blob || obj instanceof File) return obj;
  if (Array.isArray(obj)) {
    return obj.map(normalizeKeys);
  }
  const normalized: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      normalized[key] = normalizeKeys(obj[key]);
    }
  }
  if (normalized.id !== undefined && normalized._id === undefined) {
    normalized._id = normalized.id;
  }
  if (normalized._id !== undefined && normalized.id === undefined) {
    normalized.id = normalized._id;
  }
  return normalized;
}

api.interceptors.response.use(
  (response) => {
    response.data = normalizeKeys(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const base = import.meta.env.BASE_URL;
      if (window.location.pathname.includes('/admin')) {
        window.location.href = `${base}login`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

