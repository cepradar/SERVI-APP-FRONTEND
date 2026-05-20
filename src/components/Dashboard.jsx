import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminSidebar from './SideBar';
import AdminNavbar  from './NavBar';
import Modal        from './common/Modal';
import Spinner      from './ui/Spinner';
import { useNavigate }   from 'react-router-dom';
import { usePermissions } from '../context/PermissionsContext';
import { useCompanyInfo } from '../hooks/useCompanyInfo';
import { useMobile }      from '../hooks/useMobile';

// ── Lazy loading — cada módulo se carga solo cuando se necesita ───────────────
const CrudManager          = lazy(() => import('./CrudManager'));
const UserManager          = lazy(() => import('./UserManager'));
const AuditModule          = lazy(() => import('./AuditModule'));
const SalesModule          = lazy(() => import('./SalesModule'));
const ClientManager        = lazy(() => import('./ClientManager'));
const IngresoElectrodomestico = lazy(() => import('./IngresoElectrodomestico'));
const OrdenServicio        = lazy(() => import('./OrdenServicio'));
const ConfigDashboard      = lazy(() => import('./ConfigDashboard'));
const ServicioManager      = lazy(() => import('./ServicioManager'));

function ModuleSpinner() {
  return (
    <div className="flex items-center justify-center h-48">
      <Spinner size="lg" />
    </div>
  );
}

function Dashboard() {
  const [activeModule, setActiveModule]               = useState('home');
  const [activeInventoryView, setActiveInventoryView] = useState('products');
  const [showModal, setShowModal]                     = useState(false);
  const [modalMessage, setModalMessage]               = useState('');
  const [modalAction, setModalAction]                 = useState(() => () => {});
  const [isSidebarExpanded, setIsSidebarExpanded]     = useState(true);
  const [userRole, setUserRole]                       = useState(null);
  const [userName, setUserName]                       = useState(null);
  const [hasActiveForm, setHasActiveForm]             = useState(false);
  const [pendingModuleChange, setPendingModuleChange] = useState(null);

  const { permissions } = usePermissions();
  const { companyInfo, logoUrl: companyLogoUrl } = useCompanyInfo('logo');
  const { isMobile, isTablet }                   = useMobile();

  const sidebarRef = useRef(null);
  const navigate   = useNavigate();

  // En móvil el sidebar empieza cerrado
  useEffect(() => {
    if (isMobile) setIsSidebarExpanded(false);
  }, [isMobile]);

  // ── Leer credenciales del localStorage ──────────────────────────────────
  useEffect(() => {
    const role     = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    if (role)     setUserRole(role);
    if (username) setUserName(username);
    else          navigate('/login');
  }, [navigate]);

  // ── Permisos mínimos por módulo ──────────────────────────────────────────
  const MODULE_MIN_PERMISSION = useMemo(() => ({
    users:            'users.read',
    inventory:        'inventory.read',
    clients:          'clients.read',
    sales:            'sales.read',
    'ordenes-servicio': 'orders.read',
    audit:            'audit.read',
    settings:         'config.roles.read',
  }), []);

  useEffect(() => {
    if (permissions.length === 0) return;
    const required = MODULE_MIN_PERMISSION[activeModule];
    if (!required) return;
    if (!permissions.includes(required)) {
      // Settings es accesible con cualquier permiso config.* o reports.*
      if (activeModule === 'settings' && permissions.some((p) => p.startsWith('config.') || p.startsWith('reports.'))) return;
      setActiveModule('home');
    }
  }, [permissions, activeModule, MODULE_MIN_PERMISSION]);

  // ── Ancho del sidebar (solo tablet/desktop) ─────────────────────────────
  const sidebarWidth = useMemo(() => {
    if (isMobile) return 0;
    if (isTablet) return isSidebarExpanded ? 200 : 52;
    return isSidebarExpanded ? 196 : 52;
  }, [isMobile, isTablet, isSidebarExpanded]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const toggleSidebar = useCallback(() => setIsSidebarExpanded((v) => !v), []);

  const executeModuleChange = useCallback((module) => {
    setActiveModule(module);
    if (module === 'logout') {
      setShowModal(true);
      setModalMessage('¿Estás seguro de que quieres cerrar sesión?');
      setModalAction(() => () => {
        localStorage.clear();
        navigate('/login');
        setShowModal(false);
      });
    } else if (module === 'inventory') {
      setActiveInventoryView('products');
    }
  }, [navigate]);

  const handleModuleChange = useCallback((module) => {
    if (hasActiveForm && module !== activeModule) {
      setPendingModuleChange(module);
      setShowModal(true);
      setModalMessage('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?');
      setModalAction(() => () => {
        executeModuleChange(module);
        setHasActiveForm(false);
        setPendingModuleChange(null);
        setShowModal(false);
      });
      return;
    }
    executeModuleChange(module);
  }, [hasActiveForm, activeModule, executeModuleChange]);

  // ── Renderizado del módulo activo ────────────────────────────────────────
  const renderContent = useCallback(() => {
    switch (activeModule) {
      case 'home':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="mb-8">
                <div className="w-72 h-72 mx-auto bg-gray-200 rounded-2xl flex items-center justify-center border-2 border-gray-300 overflow-hidden">
                  {companyLogoUrl ? (
                    <img
                      src={companyLogoUrl}
                      alt={companyInfo?.razonSocial || 'Logo de la empresa'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm font-medium">Logo de la empresa</span>
                  )}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Bienvenido</h1>
              <p className="text-gray-600">Selecciona una opción en la barra lateral para comenzar</p>
            </div>
          </div>
        );
      case 'inventory':
        return (
          <div className="flex flex-col h-full">
            {/* Pestañas Productos / Servicios */}
            <div className="flex gap-1 px-4 pt-4 bg-white border-b border-gray-200">
              <button
                onClick={() => setActiveInventoryView('products')}
                className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                  activeInventoryView !== 'services'
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                Productos
              </button>
              {permissions.includes('services.read') && (
                <button
                  onClick={() => setActiveInventoryView('services')}
                  className={`px-4 py-2 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
                    activeInventoryView === 'services'
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Servicios
                </button>
              )}
            </div>
            {/* Contenido de la pestaña activa */}
            {activeInventoryView === 'services' ? (
              <Suspense fallback={<ModuleSpinner />}>
                <ServicioManager />
              </Suspense>
            ) : (
              <Suspense fallback={<ModuleSpinner />}>
                <CrudManager
                  resourceType="products"
                  userRole={userRole}
                  onFormStateChange={setHasActiveForm}
                />
              </Suspense>
            )}
          </div>
        );
      case 'users':
        return <Suspense fallback={<ModuleSpinner />}><UserManager /></Suspense>;
      case 'audit':
        return <Suspense fallback={<ModuleSpinner />}><AuditModule /></Suspense>;
      case 'sales':
        return <Suspense fallback={<ModuleSpinner />}><SalesModule /></Suspense>;
      case 'clients':
        return <Suspense fallback={<ModuleSpinner />}><ClientManager /></Suspense>;
      case 'settings':
        return <Suspense fallback={<ModuleSpinner />}><ConfigDashboard /></Suspense>;
      case 'ordenes-servicio':
        return <Suspense fallback={<ModuleSpinner />}><OrdenServicio /></Suspense>;
      case 'ingresos':
        return <Suspense fallback={<ModuleSpinner />}><IngresoElectrodomestico /></Suspense>;
      default:
        return null;
    }
  }, [activeModule, activeInventoryView, userRole, companyLogoUrl, companyInfo]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar / Drawer */}
      <AdminSidebar
        sidebarRef={sidebarRef}
        onModuleChange={handleModuleChange}
        isExpanded={isSidebarExpanded}
        toggleSidebar={toggleSidebar}
        activeModule={activeModule}
        userRole={userRole}
        userName={userName}
        permissions={permissions}
      />

      {/* Navbar fijo — en móvil ocupa todo el ancho; en desktop deja espacio al sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isMobile ? 0 : sidebarWidth,
          right: 0,
          height: 64,
          zIndex: 40,
          transition: 'left 0.25s ease',
        }}
      >
        <AdminNavbar
          activeModule={activeModule}
          onHomeClick={() => handleModuleChange('home')}
          companyName={companyInfo?.razonSocial}
          userRole={userRole}
          onMenuToggle={toggleSidebar}
        />
      </div>

      {/* Contenido principal */}
      <main
        className="flex flex-col bg-gray-50"
        style={{
          marginTop: 64,
          marginLeft: isMobile ? 0 : sidebarWidth,
          minHeight: 'calc(100vh - 64px)',
          transition: 'margin-left 0.25s ease',
        }}
      >
        <div className="p-3 sm:p-5 md:p-8 flex-1">
          {renderContent()}
        </div>
      </main>

      {/* Modal de confirmación */}
      {showModal && (
        <Modal
          message={modalMessage}
          onConfirm={modalAction}
          onCancel={() => {
            setShowModal(false);
            setPendingModuleChange(null);
          }}
        />
      )}
    </div>
  );
}

export default Dashboard;
