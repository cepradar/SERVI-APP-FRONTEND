import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from './utils/axiosConfig';
import {
  IdentificationIcon,
  ShieldCheckIcon,
  WrenchScrewdriverIcon,
  TagIcon,
  ArchiveBoxIcon,
  BuildingOfficeIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ── Configuración de entidades CRUD genéricas ─────────────────────────────
const ENTITIES = [
  {
    id: 'doc-tipos',
    label: 'Tipos de documento',
    Icon: IdentificationIcon,
    list:   () => api.get('/api/documento-tipos'),
    create: (data) => api.post('/api/documento-tipos', data),
    update: (item, data) => api.put(`/api/documento-tipos/${item.id}`, data),
    remove: (item) => api.delete(`/api/documento-tipos/${item.id}`),
    pk: 'id',
    fields: [
      { key: 'id', label: 'Código', placeholder: 'CC, NIT, CE, PA…', required: true, editDisabled: true },
      { key: 'name', label: 'Nombre', placeholder: 'Cédula de Ciudadanía', required: true },
    ],
    boolField: 'activo',
    columns: [
      { key: 'id', label: 'Código', cls: 'w-24 font-mono' },
      { key: 'name', label: 'Nombre' },
    ],
  },
  {
    id: 'roles',
    label: 'Roles de usuario',
    Icon: ShieldCheckIcon,
    list:   () => api.get('/api/roles'),
    create: (data) => api.post('/api/roles', data),
    update: (item, data) => api.put(`/api/roles/${item.name}`, data),
    remove: (item) => api.delete(`/api/roles/${item.name}`),
    pk: 'name',
    fields: [
      { key: 'name', label: 'Nombre', placeholder: 'SUPERVISOR, ALMACÉN…', required: true, editDisabled: true },
      { key: 'description', label: 'Descripción', placeholder: 'Descripción del rol' },
    ],
    colorField: 'color',
    boolField: 'active',
    columns: [
      { key: 'name', label: 'Rol', cls: 'font-semibold w-32' },
      { key: 'description', label: 'Descripción' },
    ],
  },
  {
    id: 'cat-electro',
    label: 'Categorías electrodoméstico',
    Icon: WrenchScrewdriverIcon,
    list:   () => api.get('/api/categorias-electrodomestico/listar-todas'),
    create: (data) => api.post('/api/categorias-electrodomestico/crear', data),
    update: (item, data) => api.put(`/api/categorias-electrodomestico/${item.id}`, data),
    remove: (item) => api.delete(`/api/categorias-electrodomestico/${item.id}`),
    pk: 'id',
    fields: [
      { key: 'nombre', label: 'Nombre', placeholder: 'Nevera, Lavadora…', required: true },
      { key: 'descripcion', label: 'Descripción', placeholder: 'Opcional' },
    ],
    boolField: 'activo',
    columns: [
      { key: 'nombre', label: 'Nombre' },
      { key: 'descripcion', label: 'Descripción' },
    ],
  },
  {
    id: 'marcas-electro',
    label: 'Marcas electrodoméstico',
    Icon: TagIcon,
    list:   () => api.get('/api/marcas-electrodomestico/listar'),
    create: (data) => api.post('/api/marcas-electrodomestico/crear', data),
    update: (item, data) => api.put(`/api/marcas-electrodomestico/${item.id}`, data),
    remove: (item) => api.delete(`/api/marcas-electrodomestico/${item.id}`),
    pk: 'id',
    fields: [
      { key: 'nombre', label: 'Nombre', placeholder: 'Samsung, LG, Whirlpool…', required: true },
    ],
    boolField: 'activo',
    columns: [
      { key: 'nombre', label: 'Nombre' },
    ],
  },
  {
    id: 'cat-productos',
    label: 'Categorías de producto',
    Icon: ArchiveBoxIcon,
    list:   () => api.get('/api/categories/listarCategoria'),
    create: (data) => api.post('/api/categories/crearCategoria', data),
    update: (item, data) => api.put(`/api/categories/${item.id}`, data),
    remove: (item) => api.delete(`/api/categories/${item.id}`),
    pk: 'id',
    fields: [
      { key: 'id', label: 'Código', placeholder: 'electr, repuestos…', required: true, editDisabled: true },
      { key: 'name', label: 'Nombre', placeholder: 'Electrónica', required: true },
      { key: 'description', label: 'Descripción', placeholder: 'Opcional' },
    ],
    columns: [
      { key: 'id', label: 'Código', cls: 'w-28 font-mono' },
      { key: 'name', label: 'Nombre' },
      { key: 'description', label: 'Descripción' },
    ],
  },
  {
    id: 'empresa',
    label: 'Info. empresa',
    Icon: BuildingOfficeIcon,
    special: 'empresa',
  },
];

// ── Sección genérica CRUD ─────────────────────────────────────────────────
function GenericCrudSection({ entity }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // form para crear
  const emptyForm = useCallback(() => {
    const f = {};
    entity.fields.forEach((fd) => { f[fd.key] = ''; });
    if (entity.boolField) f[entity.boolField] = true;
    if (entity.colorField) f[entity.colorField] = '#4f46e5';
    return f;
  }, [entity]);

  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  // edición inline
  const [editingPk, setEditingPk] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await entity.list();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setError('No se pudo cargar la lista.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [entity]);

  useEffect(() => {
    setForm(emptyForm());
    setShowForm(false);
    setEditingPk(null);
    load();
  }, [entity, load, emptyForm]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await entity.create(form);
      setForm(emptyForm());
      setShowForm(false);
      await load();
    } catch (err) {
      alert(err?.response?.data || 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    const f = {};
    entity.fields.forEach((fd) => { f[fd.key] = item[fd.key] ?? ''; });
    if (entity.boolField) f[entity.boolField] = item[entity.boolField] ?? true;
    if (entity.colorField) f[entity.colorField] = item[entity.colorField] ?? '#4f46e5';
    setEditForm(f);
    setEditingPk(item[entity.pk]);
  };

  const handleUpdate = async (item) => {
    setSaving(true);
    try {
      await entity.update(item, editForm);
      setEditingPk(null);
      await load();
    } catch (err) {
      alert(err?.response?.data || 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`¿Eliminar "${item[entity.pk]}"?`)) return;
    try {
      await entity.remove(item);
      await load();
    } catch (err) {
      alert(err?.response?.data || 'Error al eliminar');
    }
  };

  // render cell
  const renderCell = (item, col) => {
    const val = item[col.key];
    if (col.key === entity.boolField || col.type === 'bool') {
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${val ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {val ? 'Sí' : 'No'}
        </span>
      );
    }
    if (col.key === entity.colorField) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="h-5 w-5 rounded border border-gray-200" style={{ backgroundColor: val || '#ccc' }} />
          <span className="text-xs font-mono text-gray-400">{val || '-'}</span>
        </span>
      );
    }
    return <span>{val ?? '-'}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800">{entity.label}</h3>
          <p className="text-xs text-gray-400">{items.length} registro{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setEditingPk(null); }}
          className="flex items-center gap-1.5 h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <form onSubmit={handleCreate} className="border border-blue-200 rounded-lg p-4 bg-blue-50/40 space-y-3">
          <p className="text-xs font-semibold text-blue-700 mb-2">Nuevo registro</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {entity.fields.map((fd) => (
              <div key={fd.key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">{fd.label}{fd.required && ' *'}</label>
                <input
                  type="text"
                  value={form[fd.key] || ''}
                  onChange={(e) => setForm((p) => ({ ...p, [fd.key]: e.target.value }))}
                  placeholder={fd.placeholder || ''}
                  required={fd.required}
                  className="h-8 px-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            ))}
            {entity.colorField && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Color</label>
                <input
                  type="color"
                  value={form[entity.colorField] || '#4f46e5'}
                  onChange={(e) => setForm((p) => ({ ...p, [entity.colorField]: e.target.value }))}
                  className="h-8 w-full border border-gray-300 rounded cursor-pointer"
                />
              </div>
            )}
            {entity.boolField && (
              <div className="flex items-end gap-2 pb-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form[entity.boolField] ?? true}
                    onChange={(e) => setForm((p) => ({ ...p, [entity.boolField]: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-xs font-medium text-gray-600">Activo</span>
                </label>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="h-8 px-3 text-sm border border-gray-300 rounded hover:bg-gray-100">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="h-8 px-4 bg-green-600 hover:bg-green-700 text-white text-sm rounded disabled:opacity-60">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="py-8 text-sm text-gray-400 text-center">Cargando…</div>
      ) : error ? (
        <div className="py-4 text-sm text-red-500">{error}</div>
      ) : items.length === 0 ? (
        <div className="py-8 text-sm text-gray-400 text-center">Sin registros. Crea el primero.</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {entity.columns.map((col) => (
                  <th key={col.key} className={`px-3 py-2 text-left text-xs font-semibold text-gray-600 ${col.cls || ''}`}>
                    {col.label}
                  </th>
                ))}
                {entity.boolField && (
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 w-16">Activo</th>
                )}
                {entity.colorField && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 w-24">Color</th>
                )}
                <th className="px-3 py-2 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => {
                const pk = item[entity.pk];
                const isEditing = editingPk === pk;
                return (
                  <tr key={pk} className={isEditing ? 'bg-yellow-50' : 'hover:bg-gray-50 transition-colors'}>
                    {entity.columns.map((col) => (
                      <td key={col.key} className={`px-3 py-2 ${col.cls || ''}`}>
                        {isEditing && !entity.fields.find((f) => f.key === col.key)?.editDisabled ? (
                          <input
                            type="text"
                            value={editForm[col.key] ?? ''}
                            onChange={(e) => setEditForm((p) => ({ ...p, [col.key]: e.target.value }))}
                            className="w-full h-7 px-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : renderCell(item, col)}
                      </td>
                    ))}
                    {/* bool column */}
                    {entity.boolField && (
                      <td className="px-3 py-2 text-center">
                        {isEditing ? (
                          <input
                            type="checkbox"
                            checked={editForm[entity.boolField] ?? true}
                            onChange={(e) => setEditForm((p) => ({ ...p, [entity.boolField]: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                          />
                        ) : renderCell(item, { key: entity.boolField, type: 'bool' })}
                      </td>
                    )}
                    {/* color column */}
                    {entity.colorField && (
                      <td className="px-3 py-2">
                        {isEditing ? (
                          <input
                            type="color"
                            value={editForm[entity.colorField] || '#4f46e5'}
                            onChange={(e) => setEditForm((p) => ({ ...p, [entity.colorField]: e.target.value }))}
                            className="h-7 w-12 border border-gray-300 rounded cursor-pointer"
                          />
                        ) : renderCell(item, { key: entity.colorField })}
                      </td>
                    )}
                    {/* actions */}
                    <td className="px-2 py-2">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => handleUpdate(item)} disabled={saving} title="Guardar" className="h-7 w-7 flex items-center justify-center rounded bg-green-100 hover:bg-green-200 text-green-700">
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingPk(null)} title="Cancelar" className="h-7 w-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => startEdit(item)} title="Editar" className="h-7 w-7 flex items-center justify-center rounded hover:bg-blue-100 text-blue-600">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(item)} title="Eliminar" className="h-7 w-7 flex items-center justify-center rounded hover:bg-red-100 text-red-500">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Sección especial: Información de empresa ──────────────────────────────
const EMPRESA_FIELDS = [
  { key: 'razonSocial',       label: 'Razón social',          required: true },
  { key: 'nit',               label: 'NIT',                   required: true },
  { key: 'direccion',         label: 'Dirección' },
  { key: 'ciudad',            label: 'Ciudad' },
  { key: 'departamento',      label: 'Departamento' },
  { key: 'codigoPostal',      label: 'Código postal' },
  { key: 'telefono',          label: 'Teléfono' },
  { key: 'correo',            label: 'Correo' },
  { key: 'sitioWeb',          label: 'Sitio web' },
  { key: 'representanteLegal',label: 'Representante legal' },
  { key: 'numeroRegimen',     label: 'N° régimen' },
];

// Carga una imagen de empresa como object URL; devuelve null si no existe
async function fetchLogoUrl(companyId, slot) {
  try {
    const res = await api.get(`/api/company/${companyId}/${slot}`, { responseType: 'blob' });
    if (res.data && res.data.size > 0) return URL.createObjectURL(res.data);
    return null;
  } catch {
    return null;
  }
}

function LogoSlot({ label, url, onUpload, uploading }) {
  const inputRef = useRef(null);

  const handleDoubleClick = () => {
    if (inputRef.current) inputRef.current.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    // reset para permitir re-seleccionar el mismo archivo
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {/* área de imagen — doble clic para cargar */}
      <div
        onDoubleClick={handleDoubleClick}
        title="Doble clic para cambiar imagen"
        className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-colors bg-gray-50 flex items-center justify-center group"
      >
        {url ? (
          <img
            src={url}
            alt={label}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18M3.75 3h16.5A.75.75 0 0121 3.75v13.5A.75.75 0 0120.25 18H3.75A.75.75 0 013 17.25V3.75A.75.75 0 013.75 3z" />
            </svg>
            <span className="text-xs">Sin imagen</span>
          </div>
        )}
        {/* overlay al hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="text-white text-xs font-semibold text-center px-2">Doble clic para cargar</span>
        </div>
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs text-blue-600 font-semibold">Subiendo…</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <span className="text-xs text-gray-400">Doble clic para cambiar</span>
    </div>
  );
}

function EmpresaSection() {
  const [company, setCompany] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // URLs de imágenes (object URLs para evitar auth en img src)
  const [logoUrl, setLogoUrl] = useState(null);
  const [logo2Url, setLogo2Url] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLogo2, setUploadingLogo2] = useState(false);

  // Limpia los object URLs al desmontar
  useEffect(() => {
    return () => {
      if (logoUrl) URL.revokeObjectURL(logoUrl);
      if (logo2Url) URL.revokeObjectURL(logo2Url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadImages = useCallback(async (id) => {
    const [l1, l2] = await Promise.all([
      fetchLogoUrl(id, 'logo'),
      fetchLogoUrl(id, 'logo2'),
    ]);
    setLogoUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return l1; });
    setLogo2Url((prev) => { if (prev) URL.revokeObjectURL(prev); return l2; });
  }, []);

  useEffect(() => {
    api.get('/api/company/info')
      .then((res) => {
        setCompany(res.data);
        setForm(res.data || {});
        if (res.data?.id) loadImages(res.data.id);
      })
      .catch(() => setForm({}))
      .finally(() => setLoading(false));
  }, [loadImages]);

  const handleUpload = async (slot, file) => {
    if (!company?.id) return;
    const setUploading = slot === 'logo' ? setUploadingLogo : setUploadingLogo2;
    setUploading(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/api/company/${company.id}/${slot}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Recarga sólo la imagen actualizada
      const newUrl = await fetchLogoUrl(company.id, slot);
      if (slot === 'logo') {
        setLogoUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return newUrl; });
      } else {
        setLogo2Url((prev) => { if (prev) URL.revokeObjectURL(prev); return newUrl; });
      }
      setMsg('Imagen actualizada.');
    } catch (err) {
      setMsg('Error al subir imagen: ' + (err?.response?.data || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      if (company?.id) {
        await api.put(`/api/company/${company.id}`, form);
      } else {
        const res = await api.post('/api/company/crear', form);
        setCompany(res.data);
        if (res.data?.id) loadImages(res.data.id);
      }
      setMsg('Guardado correctamente.');
    } catch (err) {
      setMsg('Error al guardar: ' + (err?.response?.data || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-sm text-gray-400 text-center">Cargando…</div>;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-800">Información de empresa</h3>
        <p className="text-xs text-gray-400">{company ? 'Editar datos registrados' : 'Sin datos — completa el formulario para registrar tu empresa'}</p>
      </div>

      {/* Imágenes */}
      <div className="flex flex-wrap gap-6 items-start">
        <LogoSlot
          label="Logo principal"
          url={logoUrl}
          uploading={uploadingLogo}
          onUpload={(file) => handleUpload('logo', file)}
        />
        <LogoSlot
          label="Logo secundario (login)"
          url={logo2Url}
          uploading={uploadingLogo2}
          onUpload={(file) => handleUpload('logo2', file)}
        />
      </div>

      {/* Formulario de datos */}
      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {EMPRESA_FIELDS.map((fd) => (
          <div key={fd.key} className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">{fd.label}{fd.required && ' *'}</label>
            <input
              type="text"
              value={form[fd.key] || ''}
              onChange={(e) => setForm((p) => ({ ...p, [fd.key]: e.target.value }))}
              required={fd.required}
              className="h-8 px-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))}
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3 justify-end pt-1">
          {msg && <span className={`text-xs ${msg.startsWith('Error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</span>}
          <button type="submit" disabled={saving} className="h-9 px-5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded disabled:opacity-60">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function MiscManager() {
  const [activeId, setActiveId] = useState(ENTITIES[0].id);
  const active = ENTITIES.find((e) => e.id === activeId) || ENTITIES[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 min-h-0">
      {/* Sub-navegación izquierda */}
      <div className="border border-gray-200 rounded-lg overflow-hidden h-fit">
        <div className="bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Misceláneas
        </div>
        <div className="divide-y divide-gray-100">
          {ENTITIES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${
                activeId === id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="text-left leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="border border-gray-200 rounded-lg p-4">
        {active.special === 'empresa' ? (
          <EmpresaSection />
        ) : (
          <GenericCrudSection key={active.id} entity={active} />
        )}
      </div>
    </div>
  );
}
