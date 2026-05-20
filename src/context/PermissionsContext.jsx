import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import authService from '../api/services/authService';

const PermissionsContext = createContext({
  permissions: [],
  hasPermission: () => false,
  loading: false,
  reload: () => {},
});

/**
 * Proveedor global de permisos.
 * Carga los códigos activos del usuario desde GET /api/permissions/me
 * y los expone a través del contexto para usar con usePermissions() o <Can />.
 */
export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setPermissions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await authService.getPermissions();
      setPermissions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasPermission = useCallback(
    (code) => permissions.includes(code),
    [permissions]
  );

  return (
    <PermissionsContext.Provider value={{ permissions, hasPermission, loading, reload: load }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
