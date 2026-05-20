import React, { useState, useEffect, useCallback } from 'react';
import api from './utils/axiosConfig';
import { usePermissions } from './utils/PermissionsContext';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const CATEGORIAS = ['DIAGNOSTICO', 'MANTENIMIENTO', 'REPARACION', 'INSTALACION', 'REVISION', 'OTRO'];

const FORM_INIT = {
  codigo: '',
  nombre: '',
  descripcion: '',
  precioBase: '',
  duracionEstimadaMinutos: '',
  garantiaDias: 30,
  categoriaServicio: 'DIAGNOSTICO',
  categoriaElectrodomesticoId: '',
  activo: true,
};

export default function ServicioManager() {
  const { permissions } = usePermissions();
  const can = (c) => permissions.includes(c);

  const [servicios, setServicios] = useState([]);
  const [categoriasElectrodomestico, setCategoriasElectrodomestico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(FORM_INIT);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await api.get('/api/servicios/listar');
      setServicios(Array.isArray(resp.data) ? resp.data : []);
    } catch (e) {
      setError('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    api.get('/api/categorias-electrodomestico/listar')
      .then((r) => setCategoriasElectrodomestico(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategoriasElectrodomestico([]));
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleNew = () => {
    setFormData(FORM_INIT);
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (s) => {
    setFormData({
      codigo: s.codigo,
      nombre: s.nombre,
      descripcion: s.descripcion || '',
      precioBase: s.precioBase,
      duracionEstimadaMinutos: s.duracionEstimadaMinutos || '',
      garantiaDias: s.garantiaDias ?? 30,
      categoriaServicio: s.categoriaServicio || 'DIAGNOSTICO',
      categoriaElectrodomesticoId: s.categoriaElectrodomesticoId ?? '',
      activo: s.activo,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(FORM_INIT);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        precioBase: parseFloat(formData.precioBase) || 0,
        duracionEstimadaMinutos: formData.duracionEstimadaMinutos ? parseInt(formData.duracionEstimadaMinutos) : null,
        garantiaDias: parseInt(formData.garantiaDias) || 30,
        categoriaElectrodomesticoId: formData.categoriaElectrodomesticoId ? parseInt(formData.categoriaElectrodomesticoId) : null,
      };
      if (editingId) {
        await api.put(`/api/servicios/actualizar/${editingId}`, payload);
        setSuccessMsg('Servicio actualizado correctamente');
      } else {
        await api.post('/api/servicios/crear', payload);
        setSuccessMsg('Servicio creado correctamente');
      }
      handleCancel();
      cargar();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data || 'Error al guardar servicio');
      setTimeout(() => setError(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleDesactivar = async (id) => {
    if (!window.confirm('¿Desactivar este servicio?')) return;
    try {
      await api.patch(`/api/servicios/desactivar/${id}`);
      cargar();
    } catch (err) {
      setError('Error al desactivar servicio');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar permanentemente este servicio? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/api/servicios/eliminar/${id}`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar servicio');
      setTimeout(() => setError(null), 4000);
    }
  };

  const CATEGORIA_COLORS = {
    DIAGNOSTICO: 'bg-blue-100 text-blue-700',
    MANTENIMIENTO: 'bg-green-100 text-green-700',
    REPARACION: 'bg-orange-100 text-orange-700',
    INSTALACION: 'bg-purple-100 text-purple-700',
    REVISION: 'bg-yellow-100 text-yellow-700',
    OTRO: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Gestión de Servicios</h1>
        {can('services.create') && (
          <button
            onClick={handleNew}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-4 w-4" /> Nuevo Servicio
          </button>
        )}
      </div>

      {successMsg && (
        <div className="mb-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-3 py-2 text-sm">
          <CheckIcon className="h-4 w-4" /> {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="mb-5 bg-white border border-gray-200 rounded-xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-700 mb-3">
            {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Código <span className="text-red-500">*</span></label>
              <input name="codigo" value={formData.codigo} onChange={handleInputChange} required
                readOnly={!!editingId} disabled={!!editingId}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                placeholder="SRV-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input name="nombre" value={formData.nombre} onChange={handleInputChange} required
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                placeholder="Diagnóstico General" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={2}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 resize-none"
                placeholder="Descripción del servicio..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Precio Base (COP) <span className="text-red-500">*</span></label>
              <input name="precioBase" type="number" min="0" step="0.01" value={formData.precioBase} onChange={handleInputChange} required
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                placeholder="25000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
              <select name="categoriaServicio" value={formData.categoriaServicio} onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500">
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo Electrodoméstico</label>
              <select name="categoriaElectrodomesticoId" value={formData.categoriaElectrodomesticoId} onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500">
                <option value="">-- Sin especificar --</option>
                {categoriasElectrodomestico.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Duración estimada (min)</label>
              <input name="duracionEstimadaMinutos" type="number" min="0" value={formData.duracionEstimadaMinutos} onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                placeholder="60" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Garantía (días)</label>
              <input name="garantiaDias" type="number" min="0" value={formData.garantiaDias} onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                placeholder="30" />
            </div>
            <div className="flex items-center gap-2">
              <input id="activo" name="activo" type="checkbox" checked={formData.activo} onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
              <label htmlFor="activo" className="text-sm text-gray-700">Activo</label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-1">
              <button type="button" onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                <XMarkIcon className="h-4 w-4" /> Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex items-center gap-1 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition">
                <CheckIcon className="h-4 w-4" /> {saving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="text-center py-8 text-gray-500 text-sm">Cargando servicios...</div>
      ) : servicios.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No hay servicios registrados. {can('services.create') && 'Crea el primero con el botón "Nuevo Servicio".'}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Código</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Nombre</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Categoría</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Electrodoméstico</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Precio Base</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Garantía</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Estado</th>
                {(can('services.update') || can('services.delete')) && (
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {servicios.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-3 py-2 font-mono text-xs text-gray-600">{s.codigo}</td>
                  <td className="px-3 py-2 font-medium text-gray-800">
                    {s.nombre}
                    {s.descripcion && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{s.descripcion}</p>}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORIA_COLORS[s.categoriaServicio] || 'bg-gray-100 text-gray-700'}`}>
                      {s.categoriaServicio}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {s.categoriaElectrodomesticoNombre || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(s.precioBase)}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">{s.garantiaDias ?? 30} días</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${s.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {(can('services.update') || can('services.delete')) && (
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {can('services.update') && (
                          <button onClick={() => handleEdit(s)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition" title="Editar">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {can('services.update') && s.activo && (
                          <button onClick={() => handleDesactivar(s.id)}
                            className="p-1 text-yellow-600 hover:bg-yellow-50 rounded transition text-xs font-medium" title="Desactivar">
                            OFF
                          </button>
                        )}
                        {can('services.delete') && (
                          <button onClick={() => handleEliminar(s.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition" title="Eliminar">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
