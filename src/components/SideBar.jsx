import React, { useEffect, useRef } from 'react';
import {
  Bars3Icon,
  ArchiveBoxIcon,
  UsersIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  XMarkIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';
import { useMobile } from '../hooks/useMobile';

const NAV_ITEMS = [
  { key: 'home',             label: 'Inicio',               icon: HomeIcon,                  permission: null },
  { key: 'users',            label: 'Usuarios',             icon: UsersIcon,                 permission: 'users.read' },
  { key: 'inventory',        label: 'Inventario',           icon: ArchiveBoxIcon,            permission: 'inventory.read' },
  { key: 'clients',          label: 'Clientes',             icon: UserGroupIcon,             permission: 'clients.read' },
  { key: 'sales',            label: 'Ventas',               icon: ShoppingCartIcon,          permission: 'sales.read' },
  { key: 'ordenes-servicio', label: 'Órdenes de Servicio',  icon: ClipboardDocumentListIcon, permission: 'orders.read' },
  { key: 'audit',            label: 'Auditoría',            icon: DocumentTextIcon,          permission: 'audit.read' },
  {
    key: 'settings',
    label: 'Configuración',
    icon: Cog6ToothIcon,
    permission: null,
    customCan: (permissions) =>
      permissions.some((p) => p.startsWith('config.') || p.startsWith('reports.')),
  },
];

function NavItem({ item, active, expanded, onClick }) {
  const Icon = item.icon;
  return (
    <li>
      <button
        onClick={onClick}
        className={`
          w-full flex items-center gap-3 rounded-lg transition-all duration-150
          min-h-[44px] px-3 py-2
          ${active
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white active:bg-gray-700'}
        `}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {expanded && (
          <span className="text-sm font-medium whitespace-nowrap leading-none">
            {item.label}
          </span>
        )}
      </button>
    </li>
  );
}

function Sidebar({
  onModuleChange,
  activeModule,
  isExpanded,
  toggleSidebar,
  sidebarRef,
  userName,
  permissions = [],
}) {
  const can = (code) => permissions.includes(code);
  const { isMobile, isTablet } = useMobile();
  const overlayRef = useRef(null);

  // En móvil: drawer — cerrar con Escape
  useEffect(() => {
    if (!isMobile) return;
    const onKey = (e) => { if (e.key === 'Escape') toggleSidebar(); };
    if (isExpanded) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobile, isExpanded, toggleSidebar]);

  // Bloquear scroll del body cuando el drawer está abierto en móvil
  useEffect(() => {
    if (isMobile && isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, isExpanded]);

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission && !item.customCan) return true;
    if (item.customCan) return item.customCan(permissions);
    return can(item.permission);
  });

  const handleItemClick = (key) => {
    onModuleChange(key);
    if (isMobile) toggleSidebar();   // cerrar drawer al navegar en móvil
  };

  // ── MÓVIL: Drawer + Overlay ──────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Overlay oscuro */}
        <div
          ref={overlayRef}
          onClick={toggleSidebar}
          className={`
            fixed inset-0 bg-black/60 z-40 transition-opacity duration-300
            ${isExpanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
          `}
          aria-hidden="true"
        />

        {/* Drawer */}
        <aside
          ref={sidebarRef}
          className={`
            fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-gray-900 text-white
            flex flex-col z-50 shadow-2xl
            transform transition-transform duration-300 ease-in-out
            ${isExpanded ? 'translate-x-0' : '-translate-x-full'}
          `}
          aria-label="Menú de navegación"
        >
          {/* Header del drawer */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700/60">
            <span className="text-base font-bold tracking-wide">Menú</span>
            {userName && (
              <span className="text-xs text-gray-400 truncate max-w-[110px]">{userName}</span>
            )}
            <button
              onClick={toggleSidebar}
              className="ml-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Cerrar menú"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Items */}
          <nav className="flex-1 overflow-y-auto py-3 px-2">
            <ul className="space-y-1">
              {visibleItems.map((item) => (
                <NavItem
                  key={item.key}
                  item={item}
                  active={activeModule === item.key}
                  expanded={true}
                  onClick={() => handleItemClick(item.key)}
                />
              ))}
            </ul>
          </nav>
        </aside>
      </>
    );
  }

  // ── TABLET / DESKTOP: Sidebar colapsable ────────────────────────────────
  const sidebarWidth = isExpanded ? (isTablet ? '200px' : '196px') : '52px';

  return (
    <aside
      ref={sidebarRef}
      style={{ width: sidebarWidth, transition: 'width 0.25s ease' }}
      className="fixed inset-y-0 left-0 bg-gray-900 text-white flex flex-col z-50"
      aria-label="Menú de navegación"
    >
      {/* Toggle */}
      <div className={`flex items-center h-14 px-2 border-b border-gray-700/60 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        {isExpanded && <span className="ml-1 text-sm font-bold whitespace-nowrap">Módulos</span>}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
          aria-label={isExpanded ? 'Colapsar menú' : 'Expandir menú'}
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>

      {/* Items */}
      <nav className="flex-1 overflow-y-auto py-2 px-1.5">
        <ul className="space-y-0.5">
          {visibleItems.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              active={activeModule === item.key}
              expanded={isExpanded}
              onClick={() => handleItemClick(item.key)}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;

