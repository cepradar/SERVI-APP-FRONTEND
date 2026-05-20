import { useCallback } from 'react';
import { usePermissions } from '../context/PermissionsContext';

/**
 * Hook que provee una función `can(permission)` para verificar
 * si el usuario tiene un permiso específico.
 *
 * @returns {{ can: (permission: string) => boolean, permissions: string[] }}
 *
 * @example
 * const { can } = usePermission();
 * if (can('users.create')) { ... }
 */
export function usePermission() {
  const { permissions, hasPermission } = usePermissions();
  const can = useCallback((code) => hasPermission(code), [hasPermission]);
  return { can, permissions };
}
