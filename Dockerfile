# ── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar manifiestos para aprovechar caché de capas
COPY package*.json ./
RUN npm ci --ignore-scripts

# Copiar fuentes
COPY . .

# VITE_API_BASE_URL se puede pasar como build-arg o variable de entorno
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 2: Serve con Nginx ─────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Configuración Nginx para SPA (React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
