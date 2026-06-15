import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { PermissionsProvider } from './context/PermissionsContext';
import { SedesProvider }       from './context/SedesContext';
import { ToastProvider }       from './components/ui/Toast';
import { ErrorBoundary }       from './components/ui/ErrorBoundary';
import ProtectedRoute          from './components/common/ProtectedRoute';
import Spinner                 from './components/ui/Spinner';

// ── Lazy loading — cada módulo se carga solo cuando se necesita ──────────────
const LandingPage = lazy(() => import('./components/LandingPage'));
const Login       = lazy(() => import('./components/auth/Login'));
const Dashboard   = lazy(() => import('./components/Dashboard'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" label="Cargando página..." />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
      <h1 className="text-6xl font-bold text-gray-300">404</h1>
      <p className="text-lg text-gray-600">Página no encontrada</p>
      <a href="/" className="text-blue-600 hover:underline text-sm">Volver al inicio</a>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <PermissionsProvider>
          <SedesProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/"         element={<LandingPage />} />
                  <Route path="/login"    element={<Login />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Router>
          </SedesProvider>
        </PermissionsProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}