import React, { useEffect, useState } from 'react';
import api from './utils/axiosConfig.jsx';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import DataTable from './DataTable';

export default function ApparatusManager() {
  const [apparatus, setApparatus] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientKey, setSelectedClientKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingApparatus, setEditingApparatus] = useState(null);
  const [formData, setFormData] = useState({
    clienteId: '',
    clienteTipoDocumentoId: '',
    tipo: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    estado: 'ACTIVO'
  });

  useEffect(() => {
    fetchApparatus();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get('/api/clientes/listar');
      setClients(res.data || []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    }
  };

  const fetchApparatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/cliente-electrodomesticos/listar');
      setApparatus(res.data || []);
    } catch (err) {
      console.error('Error al cargar electrodomésticos:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clienteId: selectedClientKey ? selectedClientKey.split('::')[0] : '',
      clienteTipoDocumentoId: selectedClientKey ? selectedClientKey.split('::')[1] : '',
      tipo: '',
      marca: '',
      modelo: '',
      numeroSerie: '',
      estado: 'ACTIVO'
    });
    setEditingApparatus(null);
    setShowForm(false);
  };

  const handleNewApparatus = () => {
    if (!selectedClientKey) {
      alert('Por favor, seleccione un cliente primero');
      return;
    }
    const [clienteId, clienteTipoDocumentoId] = selectedClientKey.split('::');
    setFormData(prev => ({ ...prev, clienteId, clienteTipoDocumentoId }));
    setShowForm(true);
  };

  const filteredApparatus = selectedClientKey
    ? apparatus.filter(
        item =>
          item.clienteId?.toString() === selectedClientKey.split('::')[0] &&
          item.clienteTipoDocumentoId === selectedClientKey.split('::')[1]
      )
    : apparatus;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        clienteId: formData.clienteId,
        clienteTipoDocumentoId: formData.clienteTipoDocumentoId,
        electrodomesticoTipo: formData.tipo,
        electrodomesticoMarca: formData.marca,
        electrodomesticoModelo: formData.modelo,
        numeroSerie: formData.numeroSerie,
        estado: formData.estado
      };
      
      if (editingApparatus) {
        await api.put(`/api/cliente-electrodomesticos/${editingApparatus.id}`, payload);
      } else {
        await api.post('/api/cliente-electrodomesticos/registrar', payload);
      }
      fetchApparatus();
      resetForm();
    } catch (err) {
      console.error('Error al guardar electrodoméstico:', err);
      alert('Error al guardar el electrodoméstico: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (item) => {
    setEditingApparatus(item);
    setFormData({
      clienteId: item.clienteId?.toString() || '',
      clienteTipoDocumentoId: item.clienteTipoDocumentoId || '',
      tipo: item.electrodomesticoTipo || '',
      marca: item.electrodomesticoMarca || '',
      modelo: item.electrodomesticoModelo || '',
      numeroSerie: item.numeroSerie || '',
      estado: item.estado || 'ACTIVO'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar electrodoméstico?')) return;
    try {
      await api.delete(`/api/cliente-electrodomesticos/${id}`);
      fetchApparatus();
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Seleccionar Cliente</label>
        <select
          value={selectedClientKey}
          onChange={(e) => {
            setSelectedClientKey(e.target.value);
            setShowForm(false);
            setEditingApparatus(null);
          }}
          className="w-full md:w-1/2 border rounded px-3 py-2"
        >
          <option value="">Todos los clientes</option>
          {clients.map(client => (
            <option
              key={`${client.documento}::${client.tipoDocumentoId}`}
              value={`${client.documento}::${client.tipoDocumentoId}`}
            >
              {client.documento} ({client.tipoDocumentoId}) - {client.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Electrodomésticos Registrados</h3>
        <button
          onClick={handleNewApparatus}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Electrodoméstico
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
          <h4 className="font-semibold mb-3">{editingApparatus ? 'Editar Electrodoméstico' : 'Nuevo Electrodoméstico'}</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cliente *</label>
              <select
                name="clienteId"
                value={
                  formData.clienteId && formData.clienteTipoDocumentoId
                    ? `${formData.clienteId}::${formData.clienteTipoDocumentoId}`
                    : ''
                }
                onChange={(e) => {
                  const [clienteId, clienteTipoDocumentoId] = e.target.value.split('::');
                  setFormData(prev => ({ ...prev, clienteId, clienteTipoDocumentoId }));
                }}
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccione un cliente</option>
                {clients.map(client => (
                  <option
                    key={`${client.documento}::${client.tipoDocumentoId}`}
                    value={`${client.documento}::${client.tipoDocumentoId}`}
                  >
                    {client.nombre} {client.apellido} - {client.documento} ({client.tipoDocumentoId})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo *</label>
              <input
                type="text"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                required
                placeholder="Ej: Refrigerador, Lavadora"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Marca *</label>
              <input
                type="text"
                name="marca"
                value={formData.marca}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Modelo *</label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Número de Serie</label>
              <input
                type="text"
                name="numeroSerie"
                value={formData.numeroSerie}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado *</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingApparatus ? 'Actualizar' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        title="Electrodomésticos Registrados"
        data={filteredApparatus}
        columns={[
          { key: 'clienteNombre', label: 'Cliente', sortable: true, filterable: true },
          { key: 'electrodomesticoTipo', label: 'Tipo', sortable: true, filterable: true },
          { key: 'electrodomesticoMarca', label: 'Marca', sortable: true, filterable: true },
          { key: 'numeroSerie', label: 'Serie', sortable: true, filterable: true },
          { key: 'estado', label: 'Estado', sortable: true, filterable: true },
          {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            filterable: false,
            render: (item) => (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded inline-flex"
                  title="Editar"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded inline-flex"
                  title="Eliminar"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
