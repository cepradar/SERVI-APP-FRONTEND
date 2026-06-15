import axios from 'axios';
import { env } from '../config/env';

/**
 * Instancia Axios configurada centralmente.
 *
 * - baseURL:  leída desde src/config/env.js → VITE_API_BASE_URL
 * - timeout:  30 s (ajustable por petición)
 * - JWT:      adjuntado automáticamente por el interceptor de request
 * - 401/403:  manejados globalmente en el interceptor de response
 */
const axiosClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30000,
});

// ─── Request interceptor ────────────────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    // Los endpoints de autenticación no necesitan token
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
    // Peticiones marcadas como silenciosas propagan el error sin procesamiento
    if (error.config?.silent) return Promise.reject(error);

    const status = error.response?.status;

    if (status === 401) {
      // Token expirado o inválido → limpiar sesión y redirigir al login
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      localStorage.removeItem('userSedes');
      localStorage.removeItem('sedeActual');
      window.location.replace('/login');
      return Promise.reject(error);
    }

    if (status === 403) {
      // Permiso insuficiente → enriquecer el error con el mensaje del servidor
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
