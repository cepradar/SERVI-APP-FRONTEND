/**
 * ResponsiveModal — modal que se adapta al tamaño de pantalla:
 *  - Móvil (< md): pantalla completa con cabecera y pie pegajosos
 *  - Desktop: modal centrado con ancho configurable
 *
 * Props:
 *  isOpen      {boolean}   — controla visibilidad
 *  onClose     {function}  — callback para cerrar
 *  title       {string}    — título en la cabecera
 *  size        {string}    — 'sm' | 'md' | 'lg' | 'xl' | 'full' (desktop width)
 *  footer      {ReactNode} — contenido del pie (botones, etc.)
 *  children    {ReactNode} — cuerpo del modal
 */
import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useMobile } from '../../hooks/useMobile';

const SIZE_CLASSES = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  '2xl':'max-w-2xl',
  full: 'max-w-full',
};

export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  size = 'md',
  footer,
  children,
}) {
  const { isMobile } = useMobile();
  const dialogRef    = useRef(null);

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  // ── MÓVIL: pantalla completa ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 bg-white flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="responsive-modal-title"
        ref={dialogRef}
      >
        {/* Cabecera pegajosa */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 id="responsive-modal-title" className="text-base font-semibold text-gray-900 truncate">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children}
        </div>

        {/* Pie pegajoso */}
        {footer && (
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 bg-white">
            {footer}
          </div>
        )}
      </div>
    );
  }

  // ── DESKTOP: modal centrado ──────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="responsive-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md} flex flex-col max-h-[90vh]`}
        ref={dialogRef}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 id="responsive-modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Cuerpo scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Pie */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
