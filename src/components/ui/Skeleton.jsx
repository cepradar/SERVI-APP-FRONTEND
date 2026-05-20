/**
 * Skeleton — placeholders animados para estados de carga.
 *
 * Uso:
 *   <Skeleton />                          — línea de texto
 *   <Skeleton variant="circle" />         — avatar/icono
 *   <Skeleton variant="rect" h="h-32" />  — bloque rectangular
 *   <SkeletonTable rows={5} cols={4} />   — tabla completa
 *   <SkeletonCard />                      — tarjeta de módulo
 */
import React from 'react';

const BASE = 'animate-pulse bg-gray-200 rounded';

export function Skeleton({ variant = 'text', w = 'w-full', h = 'h-4', className = '' }) {
  if (variant === 'circle') {
    return <div className={`${BASE} rounded-full ${w} ${h} ${className}`} aria-hidden="true" />;
  }
  return <div className={`${BASE} ${w} ${h} ${className}`} aria-hidden="true" />;
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200" aria-hidden="true" aria-label="Cargando...">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton h="h-4" w="w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3">
                  <Skeleton h="h-4" w={c === 0 ? 'w-32' : 'w-full'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" w="w-10" h="h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton h="h-4" w="w-3/4" />
          <Skeleton h="h-3" w="w-1/2" />
        </div>
      </div>
      <Skeleton h="h-3" />
      <Skeleton h="h-3" w="w-5/6" />
      <Skeleton h="h-3" w="w-4/6" />
    </div>
  );
}

export function SkeletonForm({ fields = 4 }) {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton h="h-3" w="w-24" />
          <Skeleton h="h-10" />
        </div>
      ))}
    </div>
  );
}
