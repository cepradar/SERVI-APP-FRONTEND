import { usePermissions } from './PermissionsContext';

/**
 * Renderiza `children` solo si el usuario autenticado posee el permiso indicado.
 *
 * Uso:
 *   <Can permission="users.create">
 *     <button>Crear usuario</button>
 *   </Can>
 *
 *   <Can permission="sales.delete" fallback={<span>Sin acceso</span>}>
 *     <button>Eliminar venta</button>
 *   </Can>
 *
 * @param {string}  permission  Código del permiso, ej: "users.create"
 * @param {node}    fallback    Qué mostrar si no tiene el permiso (por defecto null)
 * @param {node}    children    Contenido protegido
 */
export default function Can({ permission, fallback = null, children }) {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? children : fallback;
}
