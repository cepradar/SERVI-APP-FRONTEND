/**
 * src/config/env.js
 *
 * Punto único de acceso a todas las variables de entorno de Vite.
 * Importar siempre desde aquí — nunca referenciar import.meta.env
 * directamente en servicios, hooks o componentes.
 *
 * Beneficios:
 *  - Un solo lugar para saber qué variables existen.
 *  - Fácil de testear/mockear.
 *  - Evita typos dispersos en el código.
 */

/** Fallback dinámico: apunta al origen actual en el puerto 8080.
 *  Útil cuando el frontend y el backend comparten dominio (reverse proxy). */
const _fallbackApiUrl = `${window.location.protocol}//${window.location.hostname}:8080`;

export const env = {
  /** URL base del backend API (sin slash al final) */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || _fallbackApiUrl,

  /** Modo de ejecución actual: 'development' | 'production' */
  MODE: import.meta.env.MODE,

  /** true cuando se ejecuta con `vite` (desarrollo) */
  DEV: import.meta.env.DEV,

  /** true cuando se ejecuta el build de producción */
  PROD: import.meta.env.PROD,
};
