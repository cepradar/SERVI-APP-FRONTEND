import React from 'react';

/**
 * Modal de confirmación reutilizable.
 *
 * @param {string}  message          - Mensaje principal
 * @param {function} onConfirm       - Callback al confirmar
 * @param {function} onCancel        - Callback al cancelar
 * @param {string}  [title]          - Título del modal
 * @param {string}  [confirmLabel]   - Texto del botón confirmar
 * @param {string}  [cancelLabel]    - Texto del botón cancelar
 * @param {'danger'|'primary'} [variant] - Variante visual del botón confirmar
 */
export default function Modal({
  message,
  onConfirm,
  onCancel,
  title = 'Confirmación',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
}) {
  const confirmStyles = {
    danger:  'bg-red-500 hover:bg-red-600 text-white',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-sm w-full">
        <h3
          id="modal-title"
          className="text-lg font-bold mb-3 text-center text-gray-800"
        >
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-6 text-center">{message}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={onConfirm}
            className={`font-semibold py-2 px-6 rounded-lg transition-colors text-sm ${confirmStyles[variant] ?? confirmStyles.danger}`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
