import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Ruta protegida que redirige al login si no hay token JWT.
 * No realiza validación del token en el servidor — esa validación
 * la hace el interceptor de axios al recibir un 401.
 */
export default function ProtectedRoute({ children }) {
  const isAuthenticated = Boolean(localStorage.getItem('authToken'));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
