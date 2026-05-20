import React from 'react';

/**
 * Error Boundary profesional.
 * Captura errores de renderizado en el árbol de hijos y muestra un
 * fallback visual en lugar de colapsar toda la aplicación.
 *
 * @example
 * <ErrorBoundary>
 *   <MiModulo />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // En producción conectar aquí con Sentry / LogRocket
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Algo salió mal
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {this.state.error?.message || 'Error inesperado al renderizar este módulo.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
