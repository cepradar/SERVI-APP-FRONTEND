import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from './utils/axiosConfig';
import { usePermissions } from './utils/PermissionsContext';
import ReportesModule from './ReportesModule';
import MiscManager from './MiscManager';
import SedesManager from './SedesManager';
import {
  UsersIcon,
  ArchiveBoxIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentChartBarIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  TagIcon,
} from '@heroicons/react/24/outline';

const CONFIG_OPTIONS = [
  { id: 'permisos',      label: 'Permisos por rol',                perm: 'config.roles.read',          Icon: ShieldCheckIcon },
  { id: 'reportes',      label: 'Reportes',                        perm: 'reports.read',               Icon: DocumentChartBarIcon },
  { id: 'misc',          label: 'Misceláneas',                     perm: 'config.user-types.read',     Icon: ArchiveBoxIcon },
  { id: 'sedes',         label: 'Sedes',                           perm: 'config.sedes.read',          Icon: BuildingOffice2Icon },
];

const MODULE_CONFIG = [
  { key: 'users',     label: 'Usuarios',            Icon: UsersIcon },
  { key: 'inventory', label: 'Inventario',          Icon: ArchiveBoxIcon },
  { key: 'clients',   label: 'Clientes',            Icon: UserGroupIcon },
  { key: 'sales',     label: 'Ventas',              Icon: ShoppingCartIcon },
  { key: 'orders',    label: 'Órdenes de Servicio', Icon: ClipboardDocumentListIcon },
  { key: 'audit',     label: 'Auditoría',           Icon: DocumentTextIcon },
  { key: 'config',    label: 'Configuración',       Icon: Cog6ToothIcon },
];

const CONFIG_CATEGORY_CONFIG = [
  { key: 'user-types',     label: 'Tipos de usuarios',               Icon: UsersIcon,             group: 'misc' },
  { key: 'document-types', label: 'Tipos de documento',              Icon: DocumentTextIcon,      group: 'misc' },
  { key: 'appliance-cat',  label: 'Categorías de electrodomésticos', Icon: WrenchScrewdriverIcon, group: 'misc' },
  { key: 'product-cat',    label: 'Categorías de productos',         Icon: TagIcon,               group: 'misc' },
  { key: 'roles',          label: 'Permisos por rol',                Icon: ShieldCheckIcon },
  { key: 'company',        label: 'Empresa',                         Icon: BuildingOfficeIcon,    group: 'misc' },
  { key: 'reports',        label: 'Reportes',                        Icon: DocumentChartBarIcon },
];

function ModuleCheckbox({ allActive, someActive, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = someActive && !allActive;
  }, [allActive, someActive]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allActive}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer flex-shrink-0"
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export default function ConfigDashboard() {
  const { permissions } = usePermissions();
  const can = (c) => permissions.includes(c);

  const [activeOption, setActiveOption] = useState('permisos');

  // Ajustar opción activa según permisos disponibles
  useEffect(() => {
    if (permissions.length === 0) return;
    const available = CONFIG_OPTIONS.filter((opt) => can(opt.perm));
    if (available.length > 0 && !available.find((opt) => opt.id === activeOption)) {
      setActiveOption(available[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions]);
  const [roles, setRoles] = useState([]);
  const [allPerms, setAllPerms] = useState([]);
  const [rolePerms, setRolePerms] = useState([]);
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [roleForm, setRoleForm] = useState({ name: '', color: '#4f46e5', description: '' });
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [expandedModules, setExpandedModules] = useState(() => {
    const s = {};
    MODULE_CONFIG.forEach((m) => { s[m.key] = true; });
    return s;
  });
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const s = {};
    CONFIG_CATEGORY_CONFIG.forEach((c) => { s[c.key] = true; });
    return s;
  });
  const [expandedGroups, setExpandedGroups] = useState({ misc: true });

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/roles');
      setRoles(response.data || []);
      if (response.data?.length && !response.data.find((r) => r.name === selectedRole)) {
        setSelectedRole(response.data[0].name);
      }
    } catch (err) {
      console.error('Error al cargar roles:', err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/api/permissions');
      setAllPerms(response.data || []);
    } catch (err) {
      console.error('Error al cargar permisos:', err);
    }
  };

  const fetchRolePermissions = async (roleName) => {
    if (!roleName) return;
    setLoadingPerms(true);
    try {
      const response = await api.get(`/api/permissions/role/${roleName}`);
      setRolePerms(response.data || []);
    } catch (err) {
      console.error('Error al cargar permisos del rol:', err);
    } finally {
      setLoadingPerms(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole);
      setExpandedModules(() => {
        const s = {};
        MODULE_CONFIG.forEach((m) => { s[m.key] = true; });
        return s;
      });
      setExpandedCategories(() => {
        const s = {};
        CONFIG_CATEGORY_CONFIG.forEach((c) => { s[c.key] = true; });
        return s;
      });
      setExpandedGroups({ misc: true });
    }
  }, [selectedRole]);

  const handleRoleFormChange = (e) => {
    const { name, value } = e.target;
    setRoleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/roles', roleForm);
      setRoleForm({ name: '', color: '#4f46e5', description: '' });
      fetchRoles();
    } catch (err) {
      console.error('Error al crear rol:', err);
      alert('No se pudo crear el rol');
    }
  };

  const togglePermission = (permId) => {
    setRolePerms((prev) =>
      prev.map((perm) =>
        perm.id === permId ? { ...perm, assigned: !perm.assigned } : perm
      )
    );
  };

  const toggleModuleExpand = (modKey) => {
    setExpandedModules((prev) => ({ ...prev, [modKey]: !prev[modKey] }));
  };

  const toggleCategoryExpand = (catKey) => {
    setExpandedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const toggleGroupExpand = (groupKey) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const toggleAllInGroup = (modKey, groupKey) => {
    const groupCatKeys = CONFIG_CATEGORY_CONFIG
      .filter((c) => c.group === groupKey)
      .map((c) => c.key);
    const groupPerms = rolePerms.filter(
      (p) => p.moduleKey === modKey && groupCatKeys.includes(p.categoryKey)
    );
    const allActive = groupPerms.every((p) => p.assigned);
    setRolePerms((prev) =>
      prev.map((p) =>
        p.moduleKey === modKey && groupCatKeys.includes(p.categoryKey)
          ? { ...p, assigned: !allActive }
          : p
      )
    );
  };

  const toggleAllInModule = (modKey) => {
    const inModule = rolePerms.filter((p) => (p.moduleKey || 'general') === modKey);
    const allActive = inModule.every((p) => p.assigned);
    setRolePerms((prev) =>
      prev.map((p) =>
        (p.moduleKey || 'general') === modKey ? { ...p, assigned: !allActive } : p
      )
    );
  };

  const toggleAllInCategory = (modKey, catKey) => {
    const catPerms = rolePerms.filter(
      (p) => p.moduleKey === modKey && p.categoryKey === catKey
    );
    const allActive = catPerms.every((p) => p.assigned);
    setRolePerms((prev) =>
      prev.map((p) =>
        p.moduleKey === modKey && p.categoryKey === catKey
          ? { ...p, assigned: !allActive }
          : p
      )
    );
  };

  const handleSavePermissions = async () => {
    try {
      const payload = rolePerms.map((p) => ({
        permissionCode: p.code,
        active: p.assigned ?? false,
        reason: '',
      }));
      await api.put(`/api/permissions/role/${selectedRole}`, payload);
      fetchRolePermissions(selectedRole);
    } catch (err) {
      console.error('Error al guardar permisos:', err);
      alert('No se pudieron guardar los permisos');
    }
  };

  const roleOptions = useMemo(() => roles.map((r) => r.name), [roles]);

  const permsByModule = useMemo(() => {
    const groups = {};
    rolePerms.forEach((p) => {
      const mod = p.moduleKey || 'general';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return MODULE_CONFIG
      .filter((m) => groups[m.key]?.length > 0)
      .map((m) => {
        if (m.key === 'config') {
          const catGroups = {};
          (groups[m.key] || []).forEach((p) => {
            const cat = p.categoryKey || 'general';
            if (!catGroups[cat]) catGroups[cat] = [];
            catGroups[cat].push(p);
          });
          const miscSubCategories = [];
          const directCategories = [];
          CONFIG_CATEGORY_CONFIG
            .filter((c) => catGroups[c.key]?.length > 0)
            .forEach((c) => {
              const catObj = { ...c, perms: catGroups[c.key] };
              if (c.group === 'misc') miscSubCategories.push(catObj);
              else directCategories.push(catObj);
            });
          const categories = [];
          if (miscSubCategories.length > 0) {
            categories.push({ key: 'misc', label: 'Misceláneas', Icon: ArchiveBoxIcon, isGroup: true, subCategories: miscSubCategories });
          }
          categories.push(...directCategories);
          return { ...m, categories };
        }
        return { ...m, perms: groups[m.key] };
      });
  }, [rolePerms]);

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">Configuracion</div>
          <div className="divide-y divide-gray-200">
            {CONFIG_OPTIONS.filter((opt) => can(opt.perm)).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setActiveOption(opt.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  activeOption === opt.id
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {opt.Icon && <opt.Icon className="h-4 w-4 flex-shrink-0" />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          {activeOption === 'permisos' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Permisos por rol</h3>
                <p className="text-sm text-gray-500">Activa o desactiva accesos por rol.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="text-sm font-semibold text-gray-700">Rol</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="h-9 px-3 text-sm border border-gray-300 rounded"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => fetchRolePermissions(selectedRole)}
                  className="h-9 px-3 bg-gray-200 hover:bg-gray-300 text-sm rounded"
                >
                  Refrescar
                </button>
              </div>

              {loadingPerms ? (
                <div className="py-8 text-sm text-gray-500 text-center">Cargando permisos...</div>
              ) : permsByModule.length === 0 ? (
                <div className="py-8 text-sm text-gray-500 text-center">No hay permisos configurados para este rol.</div>
              ) : (
                <div className="space-y-2">
                  {permsByModule.map((mod, idx) => {
                    const isExpanded = expandedModules[mod.key] ?? true;
                    const flatPerms = mod.categories
                      ? mod.categories.flatMap((c) =>
                          c.isGroup ? c.subCategories.flatMap((sc) => sc.perms) : c.perms
                        )
                      : mod.perms;
                    const activeCount = flatPerms.filter((p) => p.assigned).length;
                    const allActive = activeCount === flatPerms.length;
                    const someActive = activeCount > 0;
                    return (
                      <div key={mod.key} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center gap-2 px-4 py-3 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                          onClick={() => toggleModuleExpand(mod.key)}
                        >
                          <span className="text-xs font-bold text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
                          <ModuleCheckbox
                            allActive={allActive}
                            someActive={someActive}
                            onChange={() => toggleAllInModule(mod.key)}
                          />
                          {mod.Icon && <mod.Icon className="h-5 w-5 text-gray-600 flex-shrink-0" />}
                          <span className="flex-1 text-sm font-semibold text-gray-800">{mod.label}</span>
                          <span className="text-xs text-gray-500 mr-1">
                            {activeCount}/{flatPerms.length} activos
                          </span>
                          {isExpanded
                            ? <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            : <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                        </div>

                        {/* Módulo con subcategorías (config) */}
                        {isExpanded && mod.categories && (
                          <div className="divide-y divide-gray-100">
                            {mod.categories.map((cat) => {
                              if (cat.isGroup) {
                                const groupPerms = cat.subCategories.flatMap((sc) => sc.perms);
                                const groupActive = groupPerms.filter((p) => p.assigned).length;
                                const groupAll = groupActive === groupPerms.length;
                                const groupSome = groupActive > 0;
                                const groupExpanded = expandedGroups[cat.key] ?? true;
                                return (
                                  <div key={cat.key}>
                                    <div
                                      className="flex items-center gap-2 pl-12 pr-4 py-2.5 bg-indigo-50/60 cursor-pointer select-none hover:bg-indigo-100/60 transition-colors"
                                      onClick={() => toggleGroupExpand(cat.key)}
                                    >
                                      <ModuleCheckbox
                                        allActive={groupAll}
                                        someActive={groupSome}
                                        onChange={() => toggleAllInGroup(mod.key, cat.key)}
                                      />
                                      {cat.Icon && <cat.Icon className="h-4 w-4 text-indigo-500 flex-shrink-0" />}
                                      <span className="flex-1 text-xs font-semibold text-indigo-700">{cat.label}</span>
                                      <span className="text-xs text-indigo-400 mr-1">{groupActive}/{groupPerms.length} activos</span>
                                      {groupExpanded
                                        ? <ChevronDownIcon className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                                        : <ChevronRightIcon className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />}
                                    </div>
                                    {groupExpanded && (
                                      <div className="divide-y divide-gray-100">
                                        {cat.subCategories.map((subCat) => {
                                          const subActive = subCat.perms.filter((p) => p.assigned).length;
                                          const subAll = subActive === subCat.perms.length;
                                          const subSome = subActive > 0;
                                          const subExpanded = expandedCategories[subCat.key] ?? true;
                                          return (
                                            <div key={subCat.key}>
                                              <div
                                                className="flex items-center gap-2 pl-16 pr-4 py-2 bg-gray-50/60 cursor-pointer select-none hover:bg-gray-100/60 transition-colors"
                                                onClick={() => toggleCategoryExpand(subCat.key)}
                                              >
                                                <ModuleCheckbox
                                                  allActive={subAll}
                                                  someActive={subSome}
                                                  onChange={() => toggleAllInCategory(mod.key, subCat.key)}
                                                />
                                                {subCat.Icon && <subCat.Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                                                <span className="flex-1 text-xs font-semibold text-gray-600">{subCat.label}</span>
                                                <span className="text-xs text-gray-400 mr-1">{subActive}/{subCat.perms.length}</span>
                                                {subExpanded
                                                  ? <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                  : <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                                              </div>
                                              {subExpanded && (
                                                <div className="divide-y divide-gray-100">
                                                  {subCat.perms.map((perm) => (
                                                    <label
                                                      key={perm.id}
                                                      className="flex items-center gap-3 pl-24 pr-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                                                    >
                                                      <input
                                                        type="checkbox"
                                                        checked={perm.assigned ?? false}
                                                        onChange={() => togglePermission(perm.id)}
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                                      />
                                                      <div className="flex-1 min-w-0">
                                                        <div className="text-sm text-gray-800">· {perm.label}</div>
                                                        <div className="text-xs text-gray-400 font-mono">{perm.code}</div>
                                                      </div>
                                                      {perm.critical && (
                                                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">crítico</span>
                                                      )}
                                                    </label>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                              const catActive = cat.perms.filter((p) => p.assigned).length;
                              const catAll = catActive === cat.perms.length;
                              const catSome = catActive > 0;
                              const catExpanded = expandedCategories[cat.key] ?? true;
                              return (
                                <div key={cat.key}>
                                  <div
                                    className="flex items-center gap-2 pl-12 pr-4 py-2.5 bg-gray-50/60 cursor-pointer select-none hover:bg-gray-100/60 transition-colors"
                                    onClick={() => toggleCategoryExpand(cat.key)}
                                  >
                                    <ModuleCheckbox
                                      allActive={catAll}
                                      someActive={catSome}
                                      onChange={() => toggleAllInCategory(mod.key, cat.key)}
                                    />
                                    {cat.Icon && <cat.Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />}
                                    <span className="flex-1 text-xs font-semibold text-gray-700">{cat.label}</span>
                                    <span className="text-xs text-gray-400 mr-1">{catActive}/{cat.perms.length}</span>
                                    {catExpanded
                                      ? <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                      : <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />}
                                  </div>
                                  {catExpanded && (
                                    <div className="divide-y divide-gray-100">
                                      {cat.perms.map((perm) => (
                                        <label
                                          key={perm.id}
                                          className="flex items-center gap-3 pl-20 pr-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={perm.assigned ?? false}
                                            onChange={() => togglePermission(perm.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm text-gray-800">· {perm.label}</div>
                                            <div className="text-xs text-gray-400 font-mono">{perm.code}</div>
                                          </div>
                                          {perm.critical && (
                                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">crítico</span>
                                          )}
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Módulo plano (sin subcategorías) */}
                        {isExpanded && mod.perms && (
                          <div className="divide-y divide-gray-100">
                            {mod.perms.map((perm) => (
                              <label
                                key={perm.id}
                                className="flex items-center gap-3 pl-14 pr-4 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={perm.assigned ?? false}
                                  onChange={() => togglePermission(perm.id)}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm text-gray-800">· {perm.label}</div>
                                  <div className="text-xs text-gray-400 font-mono">{perm.code}</div>
                                </div>
                                {perm.critical && (
                                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">crítico</span>
                                )}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="h-9 px-6 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded"
                >
                  Guardar permisos
                </button>
              </div>
            </div>
          )}

          {activeOption === 'reportes' && (
            <div className="-m-4">
              <ReportesModule />
            </div>
          )}

          {activeOption === 'misc' && (
            <MiscManager />
          )}

          {activeOption === 'sedes' && (
            <SedesManager />
          )}

          {activeOption !== 'permisos' && activeOption !== 'reportes' && activeOption !== 'misc' && activeOption !== 'sedes' && (
            <div className="text-sm text-gray-500">
              Esta seccion estara disponible proximamente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
