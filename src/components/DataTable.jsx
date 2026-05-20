import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';

export default function DataTable({ 
  data = [], 
  columns = [], 
  onEdit, 
  onDelete,
  title
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState({});
  const [openMenu, setOpenMenu] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const menuRef = useRef(null);
  const resizingRef = useRef(null);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ajuste manual de columnas
  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!resizingRef.current) return;
      const { key, startX, startWidth } = resizingRef.current;
      const delta = event.clientX - startX;
      const nextWidth = Math.min(200, Math.max(60, startWidth + delta));
      setColumnWidths(prev => ({
        ...prev,
        [key]: nextWidth
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let result = data;

    // Aplicar filtros por columna
    Object.keys(columnFilters).forEach(key => {
      const filterValue = columnFilters[key];
      if (filterValue) {
        result = result.filter(item => {
          const value = String(item[key] || '').toLowerCase();
          return value.includes(filterValue.toLowerCase());
        });
      }
    });

    return result;
  }, [data, columnFilters]);

  // Aplicar ordenamiento
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Ordenamiento para strings
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }

      // Ordenamiento para números
      const comparison = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [data, sortConfig, columnFilters]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSort = (key, direction) => {
    setSortConfig({ key, direction });
    setOpenMenu(null);
  };

  const handleColumnFilter = (key, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleMenu = (columnKey) => {
    setOpenMenu(openMenu === columnKey ? null : columnKey);
  };

  const startResize = (event, columnKey) => {
    event.preventDefault();
    event.stopPropagation();
    const th = event.currentTarget?.closest('th');
    const currentWidth = columnWidths[columnKey] || th?.getBoundingClientRect()?.width || 140;
    resizingRef.current = {
      key: columnKey,
      startX: event.clientX,
      startWidth: currentWidth
    };
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronUpDownIcon className="h-4 w-4 opacity-40" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4" /> 
      : <ChevronDownIcon className="h-4 w-4" />;
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-base font-semibold mb-2 text-gray-800">{title}</h3>}
      
      {/* Vista de tabla para desktop y tablet */}
      <div className="hidden md:block overflow-x-auto border border-gray-200 rounded shadow-sm">
        <table className="w-full border-collapse min-w-full table-fixed">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              {columns.map(col => {
                const colWidth = columnWidths[col.key] || col.width;
                return (
                <th
                  key={col.key}
                  className={`px-2 py-1.5 text-left relative whitespace-nowrap max-w-[200px] ${col.headerClassName || ''}`}
                  style={{ width: colWidth ? `${colWidth}px` : undefined }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-gray-700 text-xs truncate max-w-[160px]">{col.label}</span>
                    
                    {col.sortable !== false && col.filterable !== false && (
                      <button
                        onClick={() => toggleMenu(col.key)}
                        className="p-0.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                        title="Opciones"
                      >
                        <FunnelIcon className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    )}
                    
                    {/* Menú desplegable */}
                    {openMenu === col.key && (
                      <div 
                        ref={menuRef}
                        className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[180px]"
                      >
                        <div className="py-0.5">
                          {col.sortable !== false && (
                            <>
                              <button
                                onClick={() => handleSort(col.key, 'asc')}
                                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 flex items-center gap-1.5"
                              >
                                <ChevronUpIcon className="h-3.5 w-3.5" />
                                Ordenar {col.label} ASC
                              </button>
                              <button
                                onClick={() => handleSort(col.key, 'desc')}
                                className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 flex items-center gap-1.5"
                              >
                                <ChevronDownIcon className="h-3.5 w-3.5" />
                                Ordenar {col.label} DESC
                              </button>
                            </>
                          )}
                          {col.filterable !== false && (
                            <>
                              <div className="border-t border-gray-200 my-0.5"></div>
                              <div className="px-3 py-1.5">
                                <input
                                  type="text"
                                  placeholder={`Filtrar por ${col.label.toLowerCase()}...`}
                                  value={columnFilters[col.key] || ''}
                                  onChange={(e) => handleColumnFilter(col.key, e.target.value)}
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    onMouseDown={(event) => startResize(event, col.key)}
                    className="absolute top-0 right-0 h-full w-2 cursor-col-resize hover:bg-gray-200/70"
                    title="Ajustar ancho"
                  />
                </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                 <td colSpan={columns.length} className="px-2 py-4 text-center text-gray-500 text-xs">
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const compositeKey = item?.documento && item?.tipoDocumentoId
                  ? `${item.documento}::${item.tipoDocumentoId}`
                  : null;
                const key = compositeKey || item?.id || item?.documento || item?.username || `row-${index}`;
                return (
                    <tr key={key} className="border-b border-gray-200 hover:bg-gray-50 transition-colors even:bg-gray-50/50">
                    {columns.map(col => {
                      const colWidth = columnWidths[col.key] || col.width;
                      return (
                      <td
                        key={`${key}-${col.key}`}
                        className={`px-2 py-1.5 text-xs text-gray-700 whitespace-nowrap max-w-[200px] truncate ${col.cellClassName || ''}`}
                        style={{ width: colWidth ? `${colWidth}px` : undefined }}
                      >
                        {col.render ? col.render(item) : (item?.[col.key] || '-')}
                      </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Vista de cards para móvil */}
      <div className="md:hidden space-y-3">
        {sortedData.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            No hay datos disponibles
          </div>
        ) : (
          paginatedData.map((item, index) => {
            const compositeKey = item?.documento && item?.tipoDocumentoId
              ? `${item.documento}::${item.tipoDocumentoId}`
              : null;
            const key = compositeKey || item?.id || item?.documento || item?.username || `card-${index}`;
            return (
              <div key={key} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-2">
                {columns.map(col => {
                  // Ocultar columna de acciones en vista móvil, se moverán al final
                  if (col.key === 'acciones') return null;
                  
                  return (
                    <div key={`${key}-${col.key}`} className="flex justify-between items-start gap-2 py-1">
                      <span className="font-semibold text-gray-600 text-sm flex-shrink-0">
                        {col.label}:
                      </span>
                      <span className="text-gray-900 text-sm text-right flex-1 break-words">
                        {col.render ? col.render(item) : (item?.[col.key] || '-')}
                      </span>
                    </div>
                  );
                })}
                
                {/* Acciones al final de la card */}
                {columns.find(col => col.key === 'acciones') && (
                  <div className="pt-2 border-t border-gray-200 mt-2">
                    {columns.find(col => col.key === 'acciones').render(item)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {sortedData.length > 0 && (
        <div className="mt-2 flex justify-end">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>
              Página {currentPage} de {totalPages} · Total {sortedData.length}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
