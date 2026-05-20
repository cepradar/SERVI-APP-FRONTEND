/**
 * ResponsiveTable — wrapper que envuelve una tabla con:
 *  - Scroll horizontal en móvil
 *  - Modo "tarjeta" opcional en xs/sm (< 640px)
 *  - Encabezado pegajoso
 *
 * Uso básico (solo scroll):
 *   <ResponsiveTable>
 *     <table>...</table>
 *   </ResponsiveTable>
 *
 * Modo tarjeta (pasa cardRenderer):
 *   <ResponsiveTable
 *     cardData={rows}
 *     cardRenderer={(row, i) => <div key={i}>{row.name}</div>}
 *   >
 *     <table>...</table>
 *   </ResponsiveTable>
 */
import React from 'react';
import { useMobile } from '../../hooks/useMobile';

export default function ResponsiveTable({ children, cardData, cardRenderer, className = '' }) {
  const { isMobile, isSmall } = useMobile();

  // Modo tarjeta solo si el caller proporciona cardRenderer y la pantalla es pequeña
  if (isSmall && cardData && cardRenderer) {
    return (
      <div className={`space-y-3 ${className}`}>
        {cardData.length === 0
          ? <p className="text-center text-gray-500 py-8 text-sm">Sin datos</p>
          : cardData.map((row, i) => cardRenderer(row, i))
        }
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <div className="min-w-full inline-block align-middle">
        {children}
      </div>
    </div>
  );
}
