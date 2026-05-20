import React from 'react';

function Modal({
  message,
  onConfirm,
  onCancel,
  title = 'Confirmación',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar'
}) {
  return (
    // Fondo oscuro semi-transparente
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Contenido del modal */}
      <div className="bg-white p-4 md:p-8 rounded-lg shadow-xl max-w-sm w-full transform transition-transform duration-300 scale-100">
        <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 text-center text-gray-800">{title}</h3>
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 text-center">{message}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <button 
            onClick={onConfirm} 
            className="bg-red-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors duration-300 text-sm md:text-base order-2 sm:order-1"
          >
            {confirmLabel}
          </button>
          <button 
            onClick={onCancel} 
            className="bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-400 transition-colors duration-300 text-sm md:text-base order-1 sm:order-2"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;