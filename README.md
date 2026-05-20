# inventory-frontend

SPA construida con **React 19 · Vite · Tailwind CSS**.

Interfaz de usuario para el Sistema de Gestión de Inventario: autenticación JWT, inventario, ventas, órdenes de servicio, clientes, reportes, auditoría y configuración.

---

## Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Configuración rápida](#configuración-rápida)
3. [Variables de entorno](#variables-de-entorno)
4. [Ejecución en desarrollo](#ejecución-en-desarrollo)
5. [Acceso remoto con Cloudflare Tunnel](#acceso-remoto-con-cloudflare-tunnel)
6. [Build de producción](#build-de-producción)
7. [Ejecución con Docker](#ejecución-con-docker)
8. [Estructura del proyecto](#estructura-del-proyecto)
9. [Módulos disponibles](#módulos-disponibles)

---

## Requisitos

| Herramienta | Versión mínima |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| Docker *(opcional)* | 24+ |

---

## Configuración rápida

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/inventory-frontend.git
cd inventory-frontend

# 2. Copiar el archivo de ejemplo
cp .env.example .env.local
# Editar .env.local → ajustar VITE_API_BASE_URL

# 3. Instalar dependencias
npm install

# 4. Arrancar en desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`.

> El backend debe estar corriendo en la URL configurada en `VITE_API_BASE_URL`.

---

## Variables de entorno

### Archivos disponibles

| Archivo | Se versiona | Propósito |
|---|---|---|
| `.env` | ✅ Sí | Valores base por defecto (localhost). No contiene secretos. |
| `.env.development` | ✅ Sí | Defaults específicos para `npm run dev`. |
| `.env.production` | ✅ Sí | Defaults específicos para `npm run build`. |
| `.env.example` | ✅ Sí | Plantilla de documentación. Copiar a `.env.local`. |
| `.env.local` | ❌ No | Overrides personales con mayor prioridad. **Nunca commitear.** |

### Prioridad de carga (mayor a menor)

```
.env.local  >  .env.[mode].local  >  .env.[mode]  >  .env
```

### Variables disponibles

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | URL base del backend Spring Boot (sin `/` al final) | `http://localhost:8080` |

### Casos de uso comunes

```bash
# Desarrollo local (backend en el mismo equipo)
VITE_API_BASE_URL=http://localhost:8080

# Acceso desde la LAN (mismo WiFi, sin tunnel)
VITE_API_BASE_URL=http://192.168.1.X:8080

# Acceso remoto con Cloudflare Tunnel
VITE_API_BASE_URL=https://mi-tunnel.trycloudflare.com

# Producción
VITE_API_BASE_URL=https://api.mi-empresa.com
```

---

## Ejecución en desarrollo

```bash
npm install
npm run dev
```

La app se recarga automáticamente ante cualquier cambio.

### Acceso desde dispositivos de la LAN

El servidor Vite escucha en `0.0.0.0:5173`. Accede desde otro dispositivo en la misma red con:

```
http://IP_DEL_HOST:5173
```

---

## Acceso remoto con Cloudflare Tunnel

Cloudflare Tunnel permite exponer el frontend y/o el backend a Internet sin abrir puertos en el router.

### Configuración del frontend

El servidor de desarrollo ya está configurado para aceptar cualquier hostname:

```js
// vite.config.js
server: {
  host: '0.0.0.0',
  allowedHosts: true,   // ← permite dominios Cloudflare Tunnel
  cors: true,
}
```

### Flujo de trabajo con tunnel

1. Iniciar el tunnel del **backend** (Spring Boot):
   ```bash
   cloudflared tunnel --url http://localhost:8080
   # → Obtendrás una URL tipo: https://xxxx-yyyy.trycloudflare.com
   ```

2. Copiar esa URL a `.env.local`:
   ```
   VITE_API_BASE_URL=https://xxxx-yyyy.trycloudflare.com
   ```

3. *(Opcional)* Iniciar un segundo tunnel para el **frontend**:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```

4. Arrancar el frontend:
   ```bash
   npm run dev
   ```

> **Nota:** Los tunnels gratuitos de Cloudflare generan una URL diferente en cada reinicio. Actualiza `.env.local` cada vez que reinicies el tunnel del backend.

---

## Build de producción

```bash
npm run build        # genera la carpeta dist/
npm run preview      # sirve localmente el build de producción
```

Para inyectar la URL del backend en el build:

```bash
VITE_API_BASE_URL=https://api.mi-empresa.com npm run build
```

Los archivos estáticos en `dist/` pueden servirse con Nginx, Apache, Vercel, Netlify, etc.

---

## Ejecución con Docker

El `Dockerfile` incluido usa una imagen Nginx para servir el build estático.

```bash
# Build pasando la URL del backend como argumento
docker build \
  --build-arg VITE_API_BASE_URL=https://api.mi-empresa.com \
  -t inventory-frontend .

# Ejecutar
docker run -p 80:80 inventory-frontend
```

La app estará disponible en `http://localhost`.

---

## Estructura del proyecto

```
src/
├── config/
│   └── env.js                # Acceso centralizado a variables de entorno
├── api/
│   ├── axiosClient.js        # Instancia Axios: JWT, interceptores, errores globales
│   └── services/             # Módulos de llamadas HTTP por dominio
│       ├── authService.js
│       ├── clientService.js
│       ├── companyService.js
│       ├── reportService.js
│       └── userService.js
├── components/
│   ├── auth/
│   │   └── Login.jsx
│   ├── common/
│   │   ├── ProtectedRoute.jsx  # Redirige a /login si no hay token
│   │   ├── Modal.jsx
│   │   ├── ResponsiveModal.jsx
│   │   └── ResponsiveTable.jsx
│   ├── ui/                   # Componentes genéricos de UI
│   │   ├── Can.jsx           # Control de acceso por permiso (CANÓNICO)
│   │   ├── ErrorBoundary.jsx
│   │   ├── Skeleton.jsx
│   │   ├── Spinner.jsx
│   │   └── Toast.jsx
│   ├── utils/
│   │   ├── axiosConfig.jsx   # Re-export → src/api/axiosClient.js
│   │   ├── Can.jsx           # Re-export → src/components/ui/Can.jsx
│   │   └── PermissionsContext.jsx  # Re-export → src/context/PermissionsContext.jsx
│   ├── Dashboard.jsx
│   ├── SideBar.jsx
│   └── NavBar.jsx
├── context/
│   └── PermissionsContext.jsx  # Contexto RBAC (implementación canónica)
├── hooks/
│   ├── useBreakpoint.js
│   ├── useCompanyInfo.js
│   ├── useFetch.js
│   ├── useMobile.js
│   └── usePermission.js
└── main.jsx                  # Punto de entrada + React Router
```

### Convenciones de imports

| Qué importar | Desde |
|---|---|
| Cliente HTTP | `src/api/axiosClient.js` |
| Servicios API | `src/api/services/[dominio]Service.js` |
| Variables de entorno | `src/config/env.js` |
| Contexto de permisos | `src/context/PermissionsContext.jsx` |
| Componente `<Can>` | `src/components/ui/Can.jsx` |

---

## Módulos disponibles

| Módulo | Ruta/acceso | Descripción |
|---|---|---|
| Login | `/login` | Autenticación JWT |
| Inventario | Dashboard | Productos y categorías |
| Ventas | Dashboard | Registro y consulta de ventas |
| Clientes | Dashboard | Gestión de clientes |
| Órdenes de servicio | Dashboard | Seguimiento de reparaciones |
| Reportes | Dashboard | JasperReports PDF/Excel |
| Auditoría | Dashboard | Trazabilidad de acciones |
| Configuración | Dashboard | Empresa, usuarios, roles |

---

## Seguridad frontend

- **Token JWT** almacenado en `localStorage`. El interceptor de Axios lo adjunta automáticamente a cada petición.
- **Logout automático**: un `401` del servidor borra el token y redirige a `/login`.
- **Rutas protegidas**: `ProtectedRoute` verifica la existencia del token en cada navegación.
- **RBAC**: el componente `<Can permission="...">` y el hook `usePermission()` controlan la visibilidad de elementos según los permisos del usuario.

---

## Licencia

MIT
