# inventory-frontend

SPA construida con **React 19 · Vite · Tailwind CSS**.

Interfaz de usuario para el Sistema de Gestión de Inventario: autenticación JWT, inventario, ventas, órdenes de servicio, clientes, reportes, auditoría y configuración.

---

## Tabla de Contenidos

1. [Requisitos](#requisitos)
2. [Configuración rápida](#configuración-rápida)
3. [Variables de entorno](#variables-de-entorno)
4. [Ejecución en desarrollo](#ejecución-en-desarrollo)
5. [Build de producción](#build-de-producción)
6. [Ejecución con Docker](#ejecución-con-docker)
7. [Estructura del proyecto](#estructura-del-proyecto)
8. [Módulos disponibles](#módulos-disponibles)

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

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | URL base del backend Spring Boot | `http://localhost:8080` |
| `VITE_ALLOWED_HOSTS` | Hosts permitidos en el servidor dev Vite | `localhost,127.0.0.1` |

Los ficheros de entorno tienen la siguiente prioridad (Vite):

1. `.env.local` *(no versionado — para desarrollo local)*
2. `.env` *(valores base versionados)*

---

## Ejecución en desarrollo

```bash
npm install
npm run dev
```

La aplicación se recarga automáticamente ante cualquier cambio.

---

## Build de producción

```bash
npm run build        # genera la carpeta dist/
npm run preview      # sirve localmente el build producción
```

Los archivos estáticos en `dist/` pueden servirse con cualquier servidor web (Nginx, Apache, Vercel, etc.).

---

## Ejecución con Docker

El `Dockerfile` incluido usa una imagen Nginx para servir el build estático.

```bash
# Build pasando la URL del backend como argumento
docker build \
  --build-arg VITE_API_BASE_URL=https://api.tu-dominio.com \
  -t inventory-frontend .

# Ejecutar
docker run -p 80:80 inventory-frontend
```

La app estará disponible en `http://localhost`.

---

## Estructura del proyecto

```
src/
├── api/
│   ├── axiosClient.js        # Instancia Axios configurada con JWT
│   └── services/             # Módulos de llamadas por dominio
├── components/
│   ├── auth/                 # Login, ProtectedRoute
│   ├── common/               # Componentes reutilizables
│   ├── layout/               # Layout principal
│   ├── modules/              # Módulos por dominio (ventas, reportes…)
│   ├── ui/                   # Componentes de UI genéricos
│   ├── utils/                # axiosConfig (re-export), Can, helpers
│   ├── Dashboard.jsx         # Contenedor principal post-login
│   ├── SideBar.jsx           # Navegación lateral
│   └── NavBar.jsx            # Barra superior
├── context/
│   └── PermissionsContext.jsx # Contexto de permisos RBAC
├── hooks/                    # Hooks personalizados
└── main.jsx                  # Punto de entrada + React Router
```

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

## Licencia

MIT

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
