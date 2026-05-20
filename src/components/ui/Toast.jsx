import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

// ─── Context ─────────────────────────────────────────────────────────────────
const ToastContext = createContext({ toast: () => {} });

// ─── Hook ────────────────────────────────────────────────────────────────────
/**
 * @returns {{ toast: { success, error, info, warn } }}
 *
 * @example
 * const { toast } = useToast();
 * toast.success('Guardado correctamente');
 * toast.error('No se pudo guardar');
 */
export function useToast() {
  return useContext(ToastContext);
}

// ─── Internal single toast ───────────────────────────────────────────────────
const ICONS = {
  success: <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />,
  error:   <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />,
  info:    <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />,
  warn:    <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />,
};

const BG = {
  success: 'bg-green-50 border-green-200',
  error:   'bg-red-50 border-red-200',
  info:    'bg-blue-50 border-blue-200',
  warn:    'bg-yellow-50 border-yellow-200',
};

function ToastItem({ id, type = 'info', message, onDismiss }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 px-4 py-3 rounded-lg border shadow-md text-sm w-80 animate-fade-in ${BG[type]}`}
    >
      {ICONS[type]}
      <span className="flex-1 text-gray-800">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Cerrar notificación"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (type, message, duration = 4000) => {
      const id = ++counterRef.current;
      setToasts((prev) => [...prev, { id, type, message }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const toast = {
    success: (msg, dur) => show('success', msg, dur),
    error:   (msg, dur) => show('error',   msg, dur),
    info:    (msg, dur) => show('info',    msg, dur),
    warn:    (msg, dur) => show('warn',    msg, dur),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Portal de toasts — esquina inferior derecha */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
