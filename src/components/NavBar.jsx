import React from 'react';
import { HomeIcon, Bars3Icon } from '@heroicons/react/24/outline';
import ProfileMenu from './ProfileMenu';
import { useMobile } from '../hooks/useMobile';

const MODULE_TITLES = {
  inventory:         'Inventario',
  users:             'Usuarios',
  audit:             'Auditoría',
  sales:             'Ventas',
  clients:           'Clientes',
  'ordenes-servicio':'Órdenes',
  settings:          'Configuración',
  home:              'Inicio',
};

export default function AdminNavbar({
  activeModule,
  onHomeClick,
  companyName,
  onMenuToggle,
}) {
  const { isMobile } = useMobile();
  const title = MODULE_TITLES[activeModule] ?? companyName ?? 'Panel';

  return (
    <header className="h-16 flex items-center justify-between bg-white border-b border-gray-200 px-3 md:px-5 gap-2 shadow-sm">
      {/* Izquierda: hamburguesa (solo móvil) + título */}
      <div className="flex items-center gap-2 min-w-0">
        {isMobile && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex-shrink-0 p-2 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Abrir menú"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        )}

        <button
          type="button"
          onClick={onHomeClick}
          className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          aria-label="Ir a inicio"
        >
          <HomeIcon className="h-5 w-5" />
        </button>

        <h1 className="text-sm md:text-base font-semibold text-gray-800 truncate">
          {title}
        </h1>
      </div>

      {/* Derecha: perfil */}
      <div className="flex-shrink-0">
        <ProfileMenu />
      </div>
    </header>
  );
}