import React, { useEffect, useState } from 'react';
import api from './utils/axiosConfig.jsx';
import { PlusIcon, PencilIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import DataTable from './DataTable';
import Modal from './Modal';
import { usePermissions } from './utils/PermissionsContext';

export default function ClientManager() {
  const { permissions } = usePermissions();
  const can = (c) => permissions.includes(c);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formMode, setFormMode] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [categoriasElectrodomestico, setCategoriasElectrodomestico] = useState([]);
  const [expandedClientKey, setExpandedClientKey] = useState(null);
  const [electrodomesticos, setElectrodomesticos] = useState([]);
  const [showElectroForm, setShowElectroForm] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateClient, setDuplicateClient] = useState(null);
  const [clientCategories, setClientCategories] = useState([]);
  const [formData, setFormData] = useState({
    nit: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: '',
    tipoDocumentoId: '',
    categoryId: ''
  });
  const [electroFormData, setElectroFormData] = useState({
    clienteId: '',
    clienteTipoDocumentoId: '',
    numeroSerie: '',
    marcaElectrodomesticoId: '',
    electrodomesticoTipo: '',
    electrodomesticoModelo: ''
  });

  useEffect(() => {
    fetchClients();
    fetchTiposDocumento();
    fetchClientCategories();
    fetchMarcas();
    fetchElectrodomesticos();
    fetchCategoriasElectrodomestico();
  }, []);

  useEffect(() => {
    if (formMode === 'create' && !formData.categoryId && clientCategories.length > 0) {
      setFormData(prev => ({ ...prev, categoryId: clientCategories[0].id }));
    }
  }, [clientCategories, formMode, formData.categoryId]);

  const fetchTiposDocumento = async () => {
    try {
      // Intentar obtener desde endpoint específico o usar valores por defecto
      setTiposDocumento([
        { id: 'CC', name: 'Cédula de Ciudadanía' },
        { id: 'NIT', name: 'Número de Identificación Tributaria' },
        { id: 'CE', name: 'Cédula de Extranjería' },
        { id: 'PASAPORTE', name: 'Pasaporte' },
        { id: 'TI', name: 'Tarjeta de Identidad' }
      ]);
    } catch (err) {
      console.error('Error al cargar tipos de documento:', err);
    }
  };

  const fetchMarcas = async () => {
    try {
      const res = await api.get('/api/marcas-electrodomestico/listar');
      setMarcas(res.data || []);
    } catch (err) {
      console.error('Error al cargar marcas:', err);
      setMarcas([]);
    }
  };

  const fetchCategoriasElectrodomestico = async () => {
    try {
      const res = await api.get('/api/categorias-electrodomestico/listar');
      setCategoriasElectrodomestico(res.data || []);
    } catch (err) {
      console.error('Error al cargar categorías de electrodoméstico:', err);
      setCategoriasElectrodomestico([]);
    }
  };

  const fetchClientCategories = async () => {
    try {
      const res = await api.get('/api/client-categories/listar', { silent: true });
      setClientCategories(res.data || []);
    } catch (err) {
      console.error('Error al cargar tipos de cliente:', err);
      setClientCategories([
        { id: 'PART', name: 'PARTICULARES' },
        { id: 'E', name: 'EMPRESAS' }
      ]);
    }
  };

  const fetchElectrodomesticos = async () => {
    try {
      const res = await api.get('/api/cliente-electrodomestico/listar');
      setElectrodomesticos(res.data || []);
    } catch (err) {
      console.error('Error al cargar electrodomésticos:', err);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/clientes/listar');
      setClients(res.data || []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTipoDocumentoLabel = (tipoId) => {
    const match = tiposDocumento.find((tipo) => String(tipo.id) === String(tipoId));
    return match?.name || tipoId || 'N/A';
  };

  const resetForm = () => {
    setFormData({
      nit: '',
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      tipoDocumentoId: 'CC',
      categoryId: clientCategories[0]?.id || ''
    });
    setEditingClient(null);
    setFormMode(null);
  };

  const openCreateForm = () => {
    setEditingClient(null);
    setFormData({
      nit: '',
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: '',
      tipoDocumentoId: 'CC',
      categoryId: clientCategories[0]?.id || ''
    });
    setFormMode('create');
  };

  const openDuplicateModal = (client) => {
    setDuplicateClient(client);
    setShowDuplicateModal(true);
  };

  const handleDuplicateEdit = () => {
    if (duplicateClient) {
      handleEdit(duplicateClient);
    }
    setShowDuplicateModal(false);
  };

  const handleDuplicateContinue = () => {
    if (duplicateClient) {
      setFormMode(null);
      setEditingClient(null);
      setShowElectroForm(null);
      setExpandedClientKey(`${duplicateClient.nit}::${duplicateClient.tipoDocumentoId}`);
      fetchElectrodomesticos();
    }
    setShowDuplicateModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formMode === 'edit' && editingClient) {
        await api.put(`/api/clientes/actualizar/${editingClient.nit}/${editingClient.tipoDocumentoId}`, formData);
      } else if (formMode === 'create') {
        const nit = formData.nit?.trim();
        const tipoDocumentoId = formData.tipoDocumentoId?.trim();
        if (!nit || !tipoDocumentoId) {
          return;
        }

        const existing = clients.find(
          (client) => client.nit === nit && client.tipoDocumentoId === tipoDocumentoId
        );

        if (existing) {
          openDuplicateModal(existing);
          return;
        }

        await api.post('/api/clientes/crear', formData);
      } else {
        return;
      }
      fetchClients();
      resetForm();
    } catch (err) {
      if (err.response?.status === 409) {
        const nit = formData.nit?.trim();
        const tipoDocumentoId = formData.tipoDocumentoId?.trim();
        if (!nit || !tipoDocumentoId) {
          return;
        }

        const existing = clients.find(
          (client) => client.nit === nit && client.tipoDocumentoId === tipoDocumentoId
        );

        let resolvedClient = existing;
        if (!resolvedClient) {
          try {
            const response = await api.get(`/api/clientes/${nit}/${tipoDocumentoId}`);
            resolvedClient = response.data;
          } catch (fetchError) {
            console.error('Error al cargar cliente existente:', fetchError);
            return;
          }
        }

        if (!resolvedClient) {
          return;
        }

        openDuplicateModal(resolvedClient);
        return;
      }

      console.error('Error al guardar cliente:', err);
      alert('Error al guardar el cliente: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      nit: client.nit || '',
      nombre: client.nombre || '',
      apellido: client.apellido || '',
      telefono: client.telefono || '',
      email: client.email || '',
      direccion: client.direccion || '',
      ciudad: client.ciudad || '',
      tipoDocumentoId: client.tipoDocumentoId || 'CC',
      categoryId: client.categoryId || ''
    });
    setFormMode('edit');
  };

  const handleDelete = async (client) => {
    if (!confirm('¿Eliminar cliente?')) return;
    try {
      await api.delete(`/api/clientes/eliminar/${client.nit}/${client.tipoDocumentoId}`);
      fetchClients();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar el cliente');
    }
  };

  const handleElectroInputChange = (e) => {
    const { name, value } = e.target;
    setElectroFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetElectroForm = () => {
    setElectroFormData({
      clienteId: '',
      clienteTipoDocumentoId: '',
      numeroSerie: '',
      marcaElectrodomesticoId: '',
      electrodomesticoTipo: '',
      electrodomesticoModelo: ''
    });
    setShowElectroForm(null);
  };

  const handleAddElectrodomestico = (cliente) => {
    const compositeKey = `${cliente.nit}::${cliente.tipoDocumentoId}`;
    setElectroFormData(prev => ({
      ...prev,
      clienteId: cliente.nit,
      clienteTipoDocumentoId: cliente.tipoDocumentoId
    }));
    setShowElectroForm(compositeKey);
  };

  const handleSubmitElectrodomestico = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        clienteId: electroFormData.clienteId,
        clienteTipoDocumentoId: electroFormData.clienteTipoDocumentoId,
        numeroSerie: electroFormData.numeroSerie,
        marcaElectrodomesticoId: parseInt(electroFormData.marcaElectrodomesticoId),
        electrodomesticoTipo: electroFormData.electrodomesticoTipo,
        electrodomesticoModelo: electroFormData.electrodomesticoModelo
      };
      await api.post('/api/cliente-electrodomestico/registrar', payload);
      fetchElectrodomesticos();
      resetElectroForm();
      alert('✅ Electrodoméstico registrado exitosamente');
    } catch (err) {
      console.error('Error al registrar electrodoméstico:', err);
      const mensaje = err.response?.data?.message || err.response?.data || err.message || 'Error desconocido';
      alert('❌ ' + mensaje);
    }
  };

  const getClientElectrodomesticos = (clienteId, clienteTipoDocumentoId) => {
    return electrodomesticos.filter(
      (e) => e.clienteId === clienteId && e.clienteTipoDocumentoId === clienteTipoDocumentoId
    );
  };

  const selectedClient = expandedClientKey
    ? clients.find((client) => `${client.nit}::${client.tipoDocumentoId}` === expandedClientKey)
    : null;

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-1 md:p-2">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <h3 className="text-sm md:text-base font-bold">Listado de Clientes</h3>
        {can('clients.create') && (
          <button
            onClick={() => (formMode === 'create' ? resetForm() : openCreateForm())}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all inline-flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            {formMode === 'create' ? 'Cancelar' : 'Nuevo Cliente'}
          </button>
        )}
      </div>

      {formMode && (
        <div className="bg-gray-50 rounded-lg mb-4 border p-3 md:p-4">
          <h4 className="font-semibold mb-2 text-sm md:text-base">
            {formMode === 'edit' ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Tipo de Cliente *</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-2 py-1 text-xs"
              >
                <option value="">Seleccionar tipo...</option>
                {clientCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Tipo de Documento *</label>
              <select
                name="tipoDocumentoId"
                value={formData.tipoDocumentoId}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-2 py-1 text-xs"
              >
                <option value="">Seleccionar tipo...</option>
                {tiposDocumento.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">NIT/Documento *</label>
              <input
                type="text"
                name="nit"
                value={formData.nit}
                onChange={handleInputChange}
                required
                disabled={!!editingClient}
                className="w-full border rounded px-2 py-1 text-xs disabled:bg-gray-200"
                placeholder="Número de identificación"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Teléfono *</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Ciudad</label>
              <input
                type="text"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleInputChange}
                className="w-full border rounded px-2 py-1 text-xs"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              {(editingClient ? can('clients.update') : can('clients.create')) && (
                <button
                  type="submit"
                  className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all"
                >
                  {editingClient ? 'Actualizar' : 'Guardar'}
                </button>
              )}
              {formMode === 'edit' && editingClient && can('clients.delete') && (
                <button
                  type="button"
                  onClick={() => handleDelete(editingClient)}
                  className="h-9 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                >
                  Eliminar
                </button>
              )}
              <button
                type="button"
                onClick={resetForm}
                className="h-9 px-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {!expandedClientKey && (
        <DataTable
          data={clients}
          columns={[
            {
              key: 'expandir',
              label: '',
              width: 44,
              headerClassName: 'px-1',
              cellClassName: 'px-1',
              sortable: false,
              filterable: false,
              render: (client) => (
                <button
                  onClick={() => {
                    const key = `${client.nit}::${client.tipoDocumentoId}`;
                    setExpandedClientKey(expandedClientKey === key ? null : key);
                  }}
                  className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white p-0.5 rounded transition-colors"
                  title="Ver electrodomésticos"
                >
                  {expandedClientKey === `${client.nit}::${client.tipoDocumentoId}` ? (
                    <ChevronUpIcon className="w-3 h-3" />
                  ) : (
                    <ChevronDownIcon className="w-3 h-3" />
                  )}
                </button>
              )
            },
            { key: 'nombre', label: 'Nombre', sortable: true, filterable: true },
            { key: 'apellido', label: 'Apellido', sortable: true, filterable: true },
            { key: 'nit', label: 'NIT/Documento', sortable: true, filterable: true },
            { key: 'tipoDocumentoId', label: 'Tipo Documento', sortable: true, filterable: true },
            { key: 'telefono', label: 'Teléfono', sortable: true, filterable: true },
            { key: 'email', label: 'Email', sortable: true, filterable: true },
            {
              key: 'acciones',
              label: '',
              width: 44,
              headerClassName: 'px-1',
              cellClassName: 'px-1',
              sortable: false,
              filterable: false,
              render: (client) => (
                <div className="flex justify-center items-center gap-1 flex-nowrap">
                  {can('clients.update') && (
                    <button
                      onClick={() => handleEdit(client)}
                      className="inline-flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white p-0.5 rounded transition-colors flex-shrink-0"
                      title="Editar"
                    >
                      <PencilIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            }
          ]}
        />
      )}

      {/* Sección de Electrodomésticos expandida */}
      {expandedClientKey && selectedClient && (
        <div className="mt-3 border rounded-lg p-3 bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
            <div>
              <h4 className="text-sm md:text-base font-semibold">
                Cliente: {selectedClient.nombre} {selectedClient.apellido}
              </h4>
              <p className="text-xs text-gray-600">
                {selectedClient.tipoDocumentoId} · {selectedClient.nit} · {selectedClient.telefono || 'Sin teléfono'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {can('clients.update') && (
                <button
                  onClick={() => handleEdit(selectedClient)}
                  className="h-9 px-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-all"
                >
                  Editar
                </button>
              )}
              <button
                onClick={() => {
                  setExpandedClientKey(null);
                  setShowElectroForm(null);
                }}
                className="h-9 px-3 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm md:text-base font-semibold">Electrodomésticos</h4>
            <button
              onClick={() => handleAddElectrodomestico(selectedClient)}
              className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all inline-flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Agregar Electrodoméstico
            </button>
          </div>

          {showElectroForm === expandedClientKey && (
            <div className="bg-white p-3 rounded-lg mb-3 border-l-4 border-blue-500">
              <h5 className="font-semibold mb-2 text-sm md:text-base">Nuevo Electrodoméstico</h5>
              <form onSubmit={handleSubmitElectrodomestico} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Marca *</label>
                      <select
                        name="marcaElectrodomesticoId"
                        value={electroFormData.marcaElectrodomesticoId}
                        onChange={handleElectroInputChange}
                        required
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Seleccionar marca...</option>
                        {marcas.map((marca) => (
                          <option key={marca.id} value={marca.id}>
                            {marca.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Categoría (Tipo) *</label>
                      <select
                        name="electrodomesticoTipo"
                        value={electroFormData.electrodomesticoTipo}
                        onChange={handleElectroInputChange}
                        required
                        className="w-full border rounded px-3 py-2"
                      >
                        <option value="">Seleccionar categoría...</option>
                        {categoriasElectrodomestico.map((cat) => (
                          <option key={cat.id} value={cat.nombre}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Modelo *</label>
                      <input
                        type="text"
                        name="electrodomesticoModelo"
                        value={electroFormData.electrodomesticoModelo}
                        onChange={handleElectroInputChange}
                        required
                        className="w-full border rounded px-3 py-2"
                        placeholder="Modelo del electrodoméstico"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Número de Serie *</label>
                      <input
                        type="text"
                        name="numeroSerie"
                        value={electroFormData.numeroSerie}
                        onChange={handleElectroInputChange}
                        required
                        className="w-full border rounded px-3 py-2"
                        placeholder="Número de serie único"
                      />
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm"
                      >
                        Guardar Electrodoméstico
                      </button>
                      <button
                        type="button"
                        onClick={resetElectroForm}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
          )}

          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-gray-100">
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-1.5 text-left">Tipo</th>
                  <th className="px-3 py-1.5 text-left">Marca</th>
                  <th className="px-3 py-1.5 text-left">Modelo</th>
                  <th className="px-3 py-1.5 text-left">Número Serie</th>
                  <th className="px-3 py-1.5 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const list = getClientElectrodomesticos(selectedClient.nit, selectedClient.tipoDocumentoId);
                  return list.length > 0 ? (
                    list.map((electro) => (
                    <tr key={electro.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-1.5">{electro.electrodomesticoTipo}</td>
                      <td className="px-3 py-1.5">{electro.marcaElectrodomestico?.nombre}</td>
                      <td className="px-3 py-1.5">{electro.electrodomesticoModelo}</td>
                      <td className="px-3 py-1.5">{electro.numeroSerie}</td>
                      <td className="px-3 py-1.5">
                        <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded text-xs">
                          {electro.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                  ) : (
                  <tr className="border-t">
                    <td colSpan="5" className="px-3 py-3 text-center text-gray-500">
                      No hay electrodomésticos registrados
                    </td>
                  </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showDuplicateModal && (
        <Modal
          title="Cliente existente"
          message="Ya existe un cliente con el mismo tipo de documento y documento."
          confirmLabel="Volver y ajustar"
          cancelLabel="Continuar"
          onConfirm={handleDuplicateEdit}
          onCancel={handleDuplicateContinue}
        />
      )}
    </div>
  );
}
