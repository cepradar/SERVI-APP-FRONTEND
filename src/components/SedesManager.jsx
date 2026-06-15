import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BuildingOffice2Icon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  PowerIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { usePermissions } from './utils/PermissionsContext';
import sedeService from '../api/services/sedeService';

// ── Toast flotante ──────────────────────────────────────────────────────────

let _toastId = 0;

function ToastContainer({ toasts, dismiss }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto max-w-sm ${
            t.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          }`}
        >
          {t.type === 'error'
            ? <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
            : <CheckIcon className="h-4 w-4 flex-shrink-0" />}
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => dismiss(t.id)} className="ml-1 p-0.5 opacity-70 hover:opacity-100">
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton Row ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

// ── Dialogo de confirmacion ─────────────────────────────────────────────────

function ConfirmDialog({ open, title, message, confirmLabel, danger, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-amber-100'}`}>
            <ExclamationTriangleIcon className={`h-5 w-5 ${danger ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} disabled={loading}
            className="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`h-9 px-4 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal de detalle ────────────────────────────────────────────────────────

function SedeDetailModal({ sede, onClose }) {
  if (!sede) return null;
  const Field = ({ label, value, mono }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={`text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>
        {value || <span className="text-gray-400 italic font-normal text-xs">No informado</span>}
      </span>
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{sede.nombre}</h3>
              <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-0.5 inline-block">{sede.codigoSede}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/70 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Identificacion</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Codigo" value={sede.codigoSede} mono />
              <Field label="Nombre" value={sede.nombre} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ubicacion</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ciudad" value={sede.ciudad} />
              <Field label="Departamento" value={sede.departamento} />
              <div className="col-span-2"><Field label="Direccion" value={sede.direccion} /></div>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contacto</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Telefono" value={sede.telefono} />
              <Field label="Email" value={sede.email} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Prefijos y Consecutivos</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">Ventas</p>
                <p className="font-mono font-bold text-blue-800 text-2xl">{sede.prefijoVentas || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-1.5">Consecutivo: <span className="font-mono font-bold">{sede.consecutivoVentas ?? 0}</span></p>
                {sede.prefijoVentas && (
                  <p className="text-[10px] font-mono text-blue-500 mt-1">
                    {sede.codigoSede}-{sede.prefijoVentas}-{String((sede.consecutivoVentas ?? 0) + 1).padStart(4, '0')}
                  </p>
                )}
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100">
                <p className="text-xs text-purple-600 font-medium mb-1">Ordenes</p>
                <p className="font-mono font-bold text-purple-800 text-2xl">{sede.prefijoOrdenes || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-1.5">Consecutivo: <span className="font-mono font-bold">{sede.consecutivoOrdenes ?? 0}</span></p>
                {sede.prefijoOrdenes && (
                  <p className="text-[10px] font-mono text-purple-500 mt-1">
                    {sede.codigoSede}-{sede.prefijoOrdenes}-{String((sede.consecutivoOrdenes ?? 0) + 1).padStart(4, '0')}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Estado</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${sede.activo !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sede.activo !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                {sede.activo !== false ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            {sede.fechaCreacion && (
              <div className="text-xs text-gray-400">
                Creada: <span className="font-medium text-gray-600">{new Date(sede.fechaCreacion).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            )}
            {sede.fechaActualizacion && (
              <div className="text-xs text-gray-400">
                Actualizada: <span className="font-medium text-gray-600">{new Date(sede.fechaActualizacion).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
          <button onClick={onClose} className="h-9 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-lg transition-colors">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ── Formulario de sede (modal) ──────────────────────────────────────────────

const EMPTY_FORM = {
  codigoSede: '', nombre: '', ciudad: '', departamento: '',
  direccion: '', telefono: '', email: '', prefijoVentas: '', prefijoOrdenes: '', activo: true,
};

function validateForm(form, isEdit) {
  const e = {};
  if (!isEdit) {
    if (!form.codigoSede?.trim()) e.codigoSede = 'El codigo es requerido';
    else if (form.codigoSede.trim().length < 2 || form.codigoSede.trim().length > 10) e.codigoSede = 'Debe tener entre 2 y 10 caracteres';
  }
  if (!form.nombre?.trim()) e.nombre = 'El nombre es requerido';
  if (!form.ciudad?.trim()) e.ciudad = 'La ciudad es requerida';
  if (!form.prefijoVentas?.trim()) e.prefijoVentas = 'Requerido';
  if (!form.prefijoOrdenes?.trim()) e.prefijoOrdenes = 'Requerido';
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalido';
  return e;
}

function SedeFormField({
  label,
  name,
  value,
  error,
  onChange,
  placeholder,
  required,
  readOnly,
  maxLength,
  hint,
  type = 'text',
  className = '',
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1.5 text-[11px]">{hint}</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        className={[
          'w-full h-9 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300',
          readOnly ? 'bg-gray-100 cursor-not-allowed text-gray-500' : '',
        ].join(' ')}
      />
      {error && (
        <p className="text-[11px] text-red-500 mt-0.5 flex items-center gap-1">
          <ExclamationTriangleIcon className="h-3 w-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}

function SedeFormModal({ open, editingSede, onClose, onSaved, notify }) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!editingSede;

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editingSede) {
      setForm({
        codigoSede:     editingSede.codigoSede    || '',
        nombre:         editingSede.nombre         || '',
        ciudad:         editingSede.ciudad         || '',
        departamento:   editingSede.departamento   || '',
        direccion:      editingSede.direccion      || '',
        telefono:       editingSede.telefono       || '',
        email:          editingSede.email          || '',
        prefijoVentas:  editingSede.prefijoVentas  || '',
        prefijoOrdenes: editingSede.prefijoOrdenes || '',
        activo:         editingSede.activo !== false,
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editingSede]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm(form, isEdit);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        nombre:         form.nombre.trim(),
        ciudad:         form.ciudad.trim(),
        departamento:   form.departamento.trim(),
        direccion:      form.direccion.trim(),
        telefono:       form.telefono.trim(),
        email:          form.email.trim(),
        prefijoVentas:  form.prefijoVentas.trim().toUpperCase(),
        prefijoOrdenes: form.prefijoOrdenes.trim().toUpperCase(),
        activo:         form.activo,
      };
      if (!isEdit) payload.codigoSede = form.codigoSede.trim().toUpperCase();
      if (isEdit) {
        await sedeService.update(editingSede.codigoSede, payload);
        notify('Sede actualizada correctamente');
      } else {
        await sedeService.create(payload);
        notify('Sede creada correctamente');
      }
      onSaved();
      onClose();
    } catch (err) {
      notify(err.response?.data?.error || err.response?.data?.message || 'Error al guardar la sede', true);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  const codePrev = isEdit ? editingSede?.codigoSede : form.codigoSede.trim().toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-900">
              {isEdit ? `Editar sede: ${editingSede.codigoSede}` : 'Nueva sede'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <XMarkIcon className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Identificacion</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SedeFormField label="Codigo de sede" name="codigoSede" value={form.codigoSede} error={errors.codigoSede} onChange={handleChange} placeholder="BQ001"
                  required={!isEdit} readOnly={isEdit} maxLength={10} hint={isEdit ? '(no editable)' : '2-10 caracteres'} />
                <SedeFormField label="Nombre" name="nombre" value={form.nombre} error={errors.nombre} onChange={handleChange} placeholder="Sede Barranquilla" required maxLength={100} />
              </div>
            </section>
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ubicacion</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SedeFormField label="Ciudad" name="ciudad" value={form.ciudad} error={errors.ciudad} onChange={handleChange} placeholder="Barranquilla" required maxLength={100} />
                <SedeFormField label="Departamento" name="departamento" value={form.departamento} error={errors.departamento} onChange={handleChange} placeholder="Atlantico" maxLength={100} />
                <SedeFormField label="Direccion" name="direccion" value={form.direccion} error={errors.direccion} onChange={handleChange} placeholder="Calle 123 #45-67" maxLength={200} className="sm:col-span-2" />
              </div>
            </section>
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contacto</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SedeFormField label="Telefono" name="telefono" value={form.telefono} error={errors.telefono} onChange={handleChange} placeholder="+57 3001234567" maxLength={20} />
                <SedeFormField label="Email" name="email" value={form.email} error={errors.email} onChange={handleChange} type="email" placeholder="sede@empresa.com" maxLength={100} />
              </div>
            </section>
            <section>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Prefijos de consecutivos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SedeFormField label="Prefijo Ventas" name="prefijoVentas" value={form.prefijoVentas} error={errors.prefijoVentas} onChange={handleChange} placeholder="V" required maxLength={5} hint="Ej: V" />
                <SedeFormField label="Prefijo Ordenes" name="prefijoOrdenes" value={form.prefijoOrdenes} error={errors.prefijoOrdenes} onChange={handleChange} placeholder="O" required maxLength={5} hint="Ej: O" />
              </div>
              {codePrev && (form.prefijoVentas || form.prefijoOrdenes) && (
                <div className="flex flex-wrap items-center gap-2 mt-2.5 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="text-[11px] text-blue-600 font-semibold">Vista previa:</span>
                  {form.prefijoVentas && (
                    <span className="text-xs font-mono bg-white border border-blue-200 text-blue-800 px-2 py-0.5 rounded">
                      {codePrev}-{form.prefijoVentas.toUpperCase()}-0001
                    </span>
                  )}
                  {form.prefijoOrdenes && (
                    <span className="text-xs font-mono bg-white border border-purple-200 text-purple-800 px-2 py-0.5 rounded">
                      {codePrev}-{form.prefijoOrdenes.toUpperCase()}-0001
                    </span>
                  )}
                </div>
              )}
            </section>
            {!isEdit && (
              <div className="flex items-center gap-2.5">
                <input type="checkbox" id="frmActivo" name="activo" checked={form.activo} onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <label htmlFor="frmActivo" className="text-sm text-gray-700 cursor-pointer select-none">Sede activa al crear</label>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-2 flex-shrink-0">
            <button type="button" onClick={onClose}
              className="h-9 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-1.5 h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
              <CheckIcon className="h-4 w-4" />
              {saving ? 'Guardando...' : isEdit ? 'Actualizar sede' : 'Crear sede'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente principal ────────────────────────────────────────────────────

export default function SedesManager() {
  const { hasPermission } = usePermissions();
  const can = hasPermission;

  const [sedes,   setSedes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [toasts,  setToasts]  = useState([]);

  const [formOpen,    setFormOpen]    = useState(false);
  const [editingSede, setEditingSede] = useState(null);
  const [detailSede,  setDetailSede]  = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState({ type: null, sede: null });
  const [confirmBusy, setConfirmBusy] = useState(false);

  const notify = useCallback((msg, isError = false) => {
    const id = ++_toastId;
    setToasts((prev) => [...prev, { id, msg, type: isError ? 'error' : 'success' }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sedeService.list();
      setSedes(Array.isArray(res.data) ? res.data : []);
    } catch {
      notify('Error al cargar sedes', true);
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sedes;
    return sedes.filter((s) =>
      (s.codigoSede    || '').toLowerCase().includes(q) ||
      (s.nombre        || '').toLowerCase().includes(q) ||
      (s.ciudad        || '').toLowerCase().includes(q) ||
      (s.departamento  || '').toLowerCase().includes(q) ||
      (s.telefono      || '').toLowerCase().includes(q)
    );
  }, [sedes, search]);

  const stats = useMemo(() => ({
    total:     sedes.length,
    activas:   sedes.filter((s) => s.activo !== false).length,
    inactivas: sedes.filter((s) => s.activo === false).length,
  }), [sedes]);

  const openCreate = () => { setEditingSede(null); setFormOpen(true); };
  const openEdit   = (s) => { setEditingSede(s);   setFormOpen(true); };
  const openDetail = (s) => setDetailSede(s);
  const askToggle  = (s) => { setConfirmData({ type: 'toggle', sede: s }); setConfirmOpen(true); };
  const askDelete  = (s) => { setConfirmData({ type: 'delete', sede: s }); setConfirmOpen(true); };

  const handleConfirm = async () => {
    const { type, sede } = confirmData;
    setConfirmBusy(true);
    try {
      if (type === 'toggle') {
        await sedeService.toggleActivo(sede.codigoSede);
        notify(`Sede ${sede.activo !== false ? 'desactivada' : 'activada'} correctamente`);
      } else if (type === 'delete') {
        await sedeService.delete(sede.codigoSede);
        notify(`Sede "${sede.nombre}" eliminada`);
      }
      load();
    } catch (err) {
      notify(err.response?.data?.error || 'Error al procesar la accion', true);
    } finally {
      setConfirmBusy(false);
      setConfirmOpen(false);
      setConfirmData({ type: null, sede: null });
    }
  };

  const handleCancelConfirm = () => {
    if (confirmBusy) return;
    setConfirmOpen(false);
    setConfirmData({ type: null, sede: null });
  };

  const confirmTitle = () => {
    if (!confirmData.sede) return '';
    if (confirmData.type === 'delete') return `Eliminar sede ${confirmData.sede.codigoSede}`;
    return confirmData.sede.activo !== false
      ? `Desactivar sede ${confirmData.sede.codigoSede}`
      : `Activar sede ${confirmData.sede.codigoSede}`;
  };

  const confirmMessage = () => {
    if (!confirmData.sede) return '';
    if (confirmData.type === 'delete')
      return `Seguro que deseas eliminar la sede "${confirmData.sede.nombre}"? Esta accion no se puede deshacer.`;
    if (confirmData.sede.activo !== false)
      return `La sede "${confirmData.sede.nombre}" quedara inactiva y no podra usarse en ventas ni ordenes de servicio.`;
    return `La sede "${confirmData.sede.nombre}" se activara y estara disponible para su uso.`;
  };

  const confirmLabel = () => {
    if (!confirmData.sede) return 'Confirmar';
    if (confirmData.type === 'delete') return 'Eliminar';
    return confirmData.sede.activo !== false ? 'Desactivar' : 'Activar';
  };

  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
      <div className="space-y-4">

        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />
              Gestion de Sedes
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Administra sucursales, prefijos y consecutivos de documentos.</p>
          </div>
          {can('config.sedes.create') && (
            <button onClick={openCreate}
              className="inline-flex items-center gap-1.5 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
              <PlusIcon className="h-4 w-4" />
              Nueva sede
            </button>
          )}
        </div>

        {/* Estadisticas */}
        {!loading && sedes.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',     value: stats.total,     bg: 'bg-gray-50 border-gray-200 text-gray-700' },
              { label: 'Activas',   value: stats.activas,   bg: 'bg-green-50 border-green-200 text-green-700' },
              { label: 'Inactivas', value: stats.inactivas, bg: 'bg-red-50 border-red-200 text-red-600' },
            ].map(({ label, value, bg }) => (
              <div key={label} className={`${bg} rounded-lg border p-3 text-center`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Buscador */}
        <div className="relative max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input type="text" placeholder="Buscar sede..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-8 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded">
              <XMarkIcon className="h-3.5 w-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">Codigo</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Nombre</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600 hidden sm:table-cell">Ciudad</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600 hidden lg:table-cell">Departamento</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600 hidden xl:table-cell">Direccion</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600 hidden md:table-cell">Telefono</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap">Pref. V/O</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">Consec. V/O</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Estado</th>
                <th className="px-3 py-2.5 text-center font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center">
                    <BuildingOffice2Icon className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-400">
                      {search ? 'Sin resultados para la busqueda' : 'No hay sedes registradas'}
                    </p>
                    {!search && can('config.sedes.create') && (
                      <button onClick={openCreate}
                        className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                        <PlusIcon className="h-3.5 w-3.5" />Crear primera sede
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((sede) => (
                  <tr key={sede.codigoSede} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-semibold whitespace-nowrap">
                        {sede.codigoSede}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-800 text-sm">{sede.nombre}</td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap hidden sm:table-cell">
                      {sede.ciudad || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs hidden lg:table-cell">
                      {sede.departamento || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs max-w-[160px] truncate hidden xl:table-cell" title={sede.direccion || ''}>
                      {sede.direccion || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs whitespace-nowrap hidden md:table-cell">
                      {sede.telefono || <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1">
                        <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded font-mono font-semibold">{sede.prefijoVentas || '-'}</span>
                        <span className="text-gray-300 text-[10px]">/</span>
                        <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded font-mono font-semibold">{sede.prefijoOrdenes || '-'}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                        <span className="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{sede.consecutivoVentas ?? 0}</span>
                        <span className="text-gray-300 text-[10px]">/</span>
                        <span className="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{sede.consecutivoOrdenes ?? 0}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sede.activo !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${sede.activo !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                        {sede.activo !== false ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center items-center gap-0.5">
                        <button onClick={() => openDetail(sede)} title="Ver detalle"
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {can('config.sedes.update') && (
                          <button onClick={() => openEdit(sede)} title="Editar sede"
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        )}
                        {can('config.sedes.toggle') && (
                          <button onClick={() => askToggle(sede)}
                            title={sede.activo !== false ? 'Desactivar' : 'Activar'}
                            className={`p-1.5 rounded-lg transition-colors ${sede.activo !== false ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                            <PowerIcon className="h-4 w-4" />
                          </button>
                        )}
                        {can('config.sedes.delete') && (
                          <button onClick={() => askDelete(sede)} title="Eliminar sede"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-gray-400 text-right">
            {search
              ? `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} de ${sedes.length} sede${sedes.length !== 1 ? 's' : ''}`
              : `${sedes.length} sede${sedes.length !== 1 ? 's' : ''} registrada${sedes.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      <SedeFormModal
        open={formOpen}
        editingSede={editingSede}
        onClose={() => setFormOpen(false)}
        onSaved={load}
        notify={notify}
      />
      <SedeDetailModal sede={detailSede} onClose={() => setDetailSede(null)} />
      <ConfirmDialog
        open={confirmOpen}
        loading={confirmBusy}
        title={confirmTitle()}
        message={confirmMessage()}
        confirmLabel={confirmLabel()}
        danger={confirmData.type === 'delete' || (confirmData.sede?.activo !== false && confirmData.type === 'toggle')}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </>
  );
}
