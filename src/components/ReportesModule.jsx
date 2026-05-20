import { useState, useEffect, useCallback } from 'react';
import axiosInstance from './utils/axiosConfig';
import { usePermissions } from './utils/PermissionsContext';
import {
  DocumentChartBarIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ─── Constantes ────────────────────────────────────────────────────────────────
const TIPOS_REPORTE = ['FACTURA', 'ORDEN_SERVICIO', 'INVENTARIO', 'TECNICO', 'OTRO'];

const TIPO_LABELS = {
  FACTURA: 'Factura',
  ORDEN_SERVICIO: 'Orden de Servicio',
  INVENTARIO: 'Inventario',
  TECNICO: 'Técnico',
  OTRO: 'Otro',
};

const TIPO_COLORS = {
  FACTURA: 'bg-blue-100 text-blue-800',
  ORDEN_SERVICIO: 'bg-purple-100 text-purple-800',
  INVENTARIO: 'bg-green-100 text-green-800',
  TECNICO: 'bg-orange-100 text-orange-800',
  OTRO: 'bg-gray-100 text-gray-700',
};

// ─── Componente principal ───────────────────────────────────────────────────────
export default function ReportesModule() {
  const { permissions } = usePermissions();
  const can = (c) => permissions.includes(c);
  const isAdmin = can('reports.upload') || can('reports.delete') || can('reports.update');

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  // Modales
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  // ─── Cargar plantillas ─────────────────────────────────────────────────────
  const cargarTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/api/reportes');
      setTemplates(data);
    } catch {
      showToast('Error al cargar las plantillas', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTemplates();
  }, [cargarTemplates]);

  // ─── Toast helper ──────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ─── Filtrado ──────────────────────────────────────────────────────────────
  const templatesFiltrados = templates.filter((t) => {
    const matchBusqueda =
      !busqueda ||
      t.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.descripcion?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.creadoPor?.toLowerCase().includes(busqueda.toLowerCase());
    const matchTipo = !filtroTipo || t.tipoReporte === filtroTipo;
    return matchBusqueda && matchTipo;
  });

  // ─── Acciones ──────────────────────────────────────────────────────────────
  const handleToggleEstado = async (template) => {
    try {
      await axiosInstance.patch(`/api/reportes/${template.id}/estado`, null, {
        params: { activo: !template.activo },
      });
      showToast(`Plantilla ${!template.activo ? 'activada' : 'desactivada'} correctamente`);
      cargarTemplates();
    } catch {
      showToast('Error al cambiar el estado', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;
    try {
      await axiosInstance.delete(`/api/reportes/${selectedTemplate.id}`);
      showToast('Plantilla eliminada correctamente');
      setShowDelete(false);
      setSelectedTemplate(null);
      cargarTemplates();
    } catch {
      showToast('No se pudo eliminar la plantilla', 'error');
    }
  };

  const handlePreview = async (template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
    setPreviewLoading(true);
    setPreviewUrl(null);
    try {
      const response = await axiosInstance.get(`/api/reportes/${template.id}/preview`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPreviewUrl(url);
    } catch {
      showToast('Error al generar la vista previa', 'error');
      setShowPreview(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (template, tipo) => {
    try {
      const response = await axiosInstance.get(`/api/reportes/${template.id}/download/${tipo}`, {
        responseType: 'blob',
      });
      const ext = tipo === 'jrxml' ? '.jrxml' : '.jasper';
      const filename = template.nombre.replace(/[^a-z0-9]/gi, '_') + ext;
      const url = URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast(`Error al descargar el archivo ${tipo.toUpperCase()}`, 'error');
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all
            ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
        >
          {toast.type === 'error' ? (
            <XCircleIcon className="h-5 w-5" />
          ) : (
            <CheckCircleIcon className="h-5 w-5" />
          )}
          {toast.message}
        </div>
      )}

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DocumentChartBarIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Gestión de Reportes</h3>
            <p className="text-sm text-gray-500">Administra las plantillas JasperReports del sistema</p>
          </div>
        </div>
        {can('reports.upload') && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Subir Plantilla
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o creador..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
        >
          <option value="">Todos los tipos</option>
          {TIPOS_REPORTE.map((t) => (
            <option key={t} value={t}>{TIPO_LABELS[t]}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : templatesFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-2">
          <DocumentChartBarIcon className="h-14 w-14 opacity-30" />
          <p className="text-lg text-gray-500">No se encontraron plantillas</p>
          {can('reports.upload') && (
            <p className="text-sm">Haz clic en &ldquo;Subir Plantilla&rdquo; para comenzar</p>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Nombre</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Tipo</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Archivos</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Creado por</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Fecha creación</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-semibold">Estado</th>
                  <th className="text-right px-4 py-3 text-gray-600 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {templatesFiltrados.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {/* Nombre */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{t.nombre}</div>
                      {t.descripcion && (
                        <div className="text-xs text-gray-400 truncate max-w-[200px]">{t.descripcion}</div>
                      )}
                      {t.esSistema && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Sistema</span>
                      )}
                    </td>
                    {/* Tipo */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${TIPO_COLORS[t.tipoReporte] || TIPO_COLORS.OTRO}`}>
                        {TIPO_LABELS[t.tipoReporte] || t.tipoReporte}
                      </span>
                    </td>
                    {/* Archivos disponibles */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {t.tieneJrxml && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-mono">.jrxml</span>
                        )}
                        {t.tieneJasper && (
                          <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-xs font-mono">.jasper</span>
                        )}
                        {!t.tieneJrxml && !t.tieneJasper && (
                          <span className="text-xs text-gray-400">Sin archivos</span>
                        )}
                      </div>
                    </td>
                    {/* Creado por */}
                    <td className="px-4 py-3 text-gray-500">{t.creadoPor || '—'}</td>
                    {/* Fecha */}
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {t.fechaCreacion ? t.fechaCreacion.replace('T', ' ').substring(0, 16) : '—'}
                    </td>
                    {/* Estado */}
                    <td className="px-4 py-3">
                      {t.activo ? (
                        <span className="flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircleIcon className="h-4 w-4" /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                          <XCircleIcon className="h-4 w-4" /> Inactivo
                        </span>
                      )}
                    </td>
                    {/* Acciones */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {can('reports.preview') && (t.tieneJrxml || t.tieneJasper) && (
                          <button
                            onClick={() => handlePreview(t)}
                            title="Vista previa"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        {can('reports.download') && t.tieneJrxml && (
                          <button
                            onClick={() => handleDownload(t, 'jrxml')}
                            title="Descargar JRXML"
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                        )}
                        {can('reports.update') && (
                          <button
                            onClick={() => { setSelectedTemplate(t); setShowEdit(true); }}
                            title="Editar metadata"
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        )}
                        {can('reports.update') && !t.esSistema && (
                          <button
                            onClick={() => handleToggleEstado(t)}
                            title={t.activo ? 'Desactivar' : 'Activar'}
                            className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                          >
                            {t.activo ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
                          </button>
                        )}
                        {can('reports.delete') && !t.esSistema && (
                          <button
                            onClick={() => { setSelectedTemplate(t); setShowDelete(true); }}
                            title="Eliminar"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
            {templatesFiltrados.length} de {templates.length} plantillas
          </div>
        </div>
      )}

      {/* ─── Modal: Subir plantilla ─────────────────────────────────────────── */}
      {showUpload && (
        <ModalSubirPlantilla
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); cargarTemplates(); showToast('Plantilla subida correctamente'); }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* ─── Modal: Editar metadata ─────────────────────────────────────────── */}
      {showEdit && selectedTemplate && (
        <ModalEditarPlantilla
          template={selectedTemplate}
          onClose={() => { setShowEdit(false); setSelectedTemplate(null); }}
          onSuccess={() => { setShowEdit(false); setSelectedTemplate(null); cargarTemplates(); showToast('Plantilla actualizada'); }}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}

      {/* ─── Modal: Confirmar eliminación ──────────────────────────────────── */}
      {showDelete && selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-red-600">
              <ExclamationTriangleIcon className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
            </div>
            <p className="text-gray-600 text-sm">
              ¿Estás seguro de que deseas eliminar la plantilla{' '}
              <span className="font-semibold text-gray-900">{selectedTemplate.nombre}</span>?
              <br />
              <span className="text-red-500">Esta acción también eliminará los archivos asociados y no se puede deshacer.</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDelete(false); setSelectedTemplate(null); }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Vista previa PDF ────────────────────────────────────────── */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <h3 className="text-gray-800 font-medium text-sm">
              Vista previa: {selectedTemplate?.nombre}
            </h3>
            <button
              onClick={() => { setShowPreview(false); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
              className="text-gray-500 hover:text-gray-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {previewLoading ? (
              <div className="flex items-center justify-center h-full bg-white">
                <div className="text-center space-y-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto" />
                  <p className="text-gray-500 text-sm">Generando vista previa con datos de muestra...</p>
                </div>
              </div>
            ) : previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full" title="Vista previa PDF" />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal: Subir nueva plantilla ──────────────────────────────────────────────
function ModalSubirPlantilla({ onClose, onSuccess, onError }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('FACTURA');
  const [descripcion, setDescripcion] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.jrxml') && !file.name.endsWith('.jasper')) {
      onError('Solo se aceptan archivos .jrxml o .jasper');
      return;
    }
    setArchivo(file);
    if (!nombre) setNombre(file.name.replace(/\.(jrxml|jasper)$/, '').replace(/_/g, ' '));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) { onError('El nombre es obligatorio'); return; }
    if (!archivo) { onError('Debes seleccionar un archivo'); return; }

    const formData = new FormData();
    formData.append('nombre', nombre.trim());
    formData.append('tipoReporte', tipo);
    formData.append('descripcion', descripcion.trim());
    formData.append('archivo', archivo);

    setLoading(true);
    try {
      await axiosInstance.post('/api/reportes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess();
    } catch (err) {
      onError(err?.response?.data?.message || 'Error al subir la plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Subir nueva plantilla</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><XMarkIcon className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
              placeholder="Nombre descriptivo de la plantilla"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de reporte *</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
            >
              {TIPOS_REPORTE.map((t) => (
                <option key={t} value={t}>{TIPO_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Descripción opcional..."
            />
          </div>

          {/* Zona de arrastrar / soltar */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
            onClick={() => document.getElementById('file-input').click()}
          >
            <ArrowUpTrayIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            {archivo ? (
              <div>
                <p className="text-sm text-green-600 font-medium">{archivo.name}</p>
                <p className="text-xs text-gray-400">{(archivo.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Arrastra aquí o haz clic para seleccionar</p>
                <p className="text-xs text-gray-400 mt-1">Formatos: .jrxml · .jasper (máx. 10 MB)</p>
              </div>
            )}
            <input
              id="file-input"
              type="file"
              accept=".jrxml,.jasper"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {loading ? 'Subiendo...' : 'Subir plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Editar metadata ────────────────────────────────────────────────────
function ModalEditarPlantilla({ template, onClose, onSuccess, onError }) {
  const [nombre, setNombre] = useState(template.nombre || '');
  const [tipo, setTipo] = useState(template.tipoReporte || 'OTRO');
  const [descripcion, setDescripcion] = useState(template.descripcion || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) { onError('El nombre es obligatorio'); return; }

    setLoading(true);
    try {
      await axiosInstance.put(`/api/reportes/${template.id}`, {
        nombre: nombre.trim(),
        tipoReporte: tipo,
        descripcion: descripcion.trim(),
      });
      onSuccess();
    } catch {
      onError('Error al actualizar la plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Editar plantilla</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><XMarkIcon className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500"
              required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de reporte</label>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500">
              {TIPOS_REPORTE.map((t) => (<option key={t} value={t}>{TIPO_LABELS[t]}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={2}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
