import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Configuración Vite — inventory-frontend
 *
 * server.host: '0.0.0.0'
 *   Acepta conexiones externas (LAN, Cloudflare Tunnel).
 *
 * server.allowedHosts: true
 *   Permite cualquier hostname en el servidor de desarrollo.
 *   Necesario para acceso vía Cloudflare Tunnel (*.trycloudflare.com).
 *   En producción el frontend se sirve con Nginx/Docker; esta opción
 *   no tiene efecto sobre el build final.
 *
 * server.cors: true
 *   Habilita CORS en el servidor dev para facilitar pruebas externas.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    cors: true,
  },
})
