import axios from 'axios';

// La URL base del backend se define exclusivamente mediante la variable de entorno
// VITE_API_BASE_URL (fichero .env o .env.local).
// Fallback al origen actual en el puerto 8080 si no se define (útil en dev).
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:8080`;

const axiosClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

// ─── Request interceptor ────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const isAuthEndpoint =
      config.url?.includes('/auth/login') ||
      config.url?.includes('/auth/register');

    if (isAuthEndpoint) {
      config.silent = true;
      return config;
    }

    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ───────────────────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.silent) return Promise.reject(error);

    const status = error.response?.status;

    if (status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      window.location.replace('/login');
      return Promise.reject(error);
    }

    if (status === 403) {
      const serverMsg =
        error.response?.data?.error || 'No tienes permisos para realizar esta acción.';
      const enhanced = new Error(serverMsg);
      enhanced.status = 403;
      enhanced.originalError = error;
      return Promise.reject(enhanced);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
