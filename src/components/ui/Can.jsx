import { usePermissions } from '../../context/PermissionsContext';

/**
 * Renderiza `children` solo si el usuario tiene el permiso indicado.
 *
 * @param {string}  permission  Código del permiso, ej: "users.create"
 * @param {node}    [fallback]  Qué mostrar si no tiene el permiso (default: null)
 * @param {node}    children    Contenido protegido
 *
 * @example
 * <Can permission="users.create">
 *   <button>Crear usuario</button>
 * </Can>
 */
export default function Can({ permission, fallback = null, children }) {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? children : fallback;
}
