import React, { useEffect, useState } from 'react';
import api from './utils/axiosConfig.jsx';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import DataTable from './DataTable';

export default function ServiceRepairManager() {
  const [services, setServices] = useState([]);
  const [apparatus, setApparatus] = useState([]);
  const [selectedApparatusId, setSelectedApparatusId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    clienteElectrodomesticoId: '',
    tipoServicio: 'REPARACION',
    descripcionProblema: '',
    diagnostico: '',
    repuestos: '',
    costoManoObra: '',
    costoRepuestos: '',
    estado: 'PENDIENTE'
  });

  useEffect(() => {
    fetchServices();
    fetchApparatus();
  }, []);

  const fetchApparatus = async () => {
    try {
      const res = await api.get('/api/cliente-electrodomesticos/listar');
      setApparatus(res.data || []);
    } catch (err) {
      console.error('Error al cargar electrodomésticos:', err);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/servicios/listar');
      setServices(res.data || []);
    } catch (err) {
      console.error('Error al cargar servicios:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clienteElectrodomesticoId: selectedApparatusId || '',
      tipoServicio: 'REPARACION',
      descripcionProblema: '',
      diagnostico: '',
      repuestos: '',
      costoManoObra: '',
      costoRepuestos: '',
      estado: 'PENDIENTE'
    });
    setEditingService(null);
    setShowForm(false);
  };

  const handleNewService = () => {
    if (!selectedApparatusId) {
      alert('Por favor, seleccione un electrodoméstico primero');
      return;
    }
    setFormData(prev => ({ ...prev, clienteElectrodomesticoId: selectedApparatusId }));
    setShowForm(true);
  };

  const filteredServices = selectedApparatusId
    ? services.filter(service => service.clienteElectrodomesticoId?.toString() === selectedApparatusId)
    : services;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        clienteElectrodomesticoId: parseInt(formData.clienteElectrodomesticoId),
        tipoServicio: formData.tipoServicio,
        descripcionProblema: formData.descripcionProblema,
        diagnostico: formData.diagnostico,
        repuestos: formData.repuestos,
        costoManoObra: parseFloat(formData.costoManoObra) || 0,
        costoRepuestos: parseFloat(formData.costoRepuestos) || 0,
        estado: formData.estado
      };
      
      if (editingService) {
        await api.put(`/api/servicios/${editingService.id}`, payload);
      } else {
        await api.post('/api/servicios/registrar', payload);
      }
      fetchServices();
      resetForm();
    } catch (err) {
      console.error('Error al guardar servicio:', err);
      alert('Error al guardar el servicio: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      clienteElectrodomesticoId: service.clienteElectrodomesticoId?.toString() || '',
      tipoServicio: service.tipoServicio || 'REPARACION',
      descripcionProblema: service.descripcionProblema || '',
      diagnostico: service.diagnostico || '',
      repuestos: service.repuestos || '',
      costoManoObra: service.costoManoObra?.toString() || '',
      costoRepuestos: service.costoRepuestos?.toString() || '',
      estado: service.estado || 'PENDIENTE'
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar servicio?')) return;
    try {
      await api.delete(`/api/servicios/${id}`);
      fetchServices();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar el servicio');
    }
  };

  if (loading) return <div className="text-center p-4">Cargando...</div>;

  return (
    <div className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Seleccionar Electrodoméstico</label>
        <select
          value={selectedApparatusId}
          onChange={(e) => {
            setSelectedApparatusId(e.target.value);
            setShowForm(false);
            setEditingService(null);
          }}
          className="w-full md:w-1/2 border rounded px-3 py-2"
        >
          <option value="">Todos los electrodomésticos</option>
          {apparatus.map(item => (
            <option key={item.id} value={item.id}>
              {item.clienteNombre} - {item.electrodomesticoTipo} {item.electrodomesticoMarca} ({item.numeroSerie || 'S/N'})
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Servicios de Reparación</h3>
        <button
          onClick={handleNewService}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 border">
          <h4 className="font-semibold mb-3">{editingService ? 'Editar Servicio' : 'Nuevo Servicio'}</h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Electrodoméstico *</label>
              <select
                name="clienteElectrodomesticoId"
                value={formData.clienteElectrodomesticoId}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccione electrodoméstico</option>
                {apparatus.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.clienteNombre} - {item.electrodomesticoTipo} {item.electrodomesticoMarca}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Servicio *</label>
              <select
                name="tipoServicio"
                value={formData.tipoServicio}
                onChange={handleInputChange}
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="REPARACION">REPARACION</option>
                <option value="MANTENIMIENTO">MANTENIMIENTO</option>
                <option value="DIAGNOSTICO">DIAGNOSTICO</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Descripción del Problema *</label>
              <textarea
                name="descripcionProblema"
                value={formData.descripcionProblema}
                onChange={handleInputChange}
                required
                rows="2"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Diagnóstico</label>
              <textarea
                name="diagnostico"
                value={formData.diagnostico}
                onChange={handleInputChange}
                rows="2"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Repuestos</label>
              <input
                type="text"
                name="repuestos"
                value={formData.repuestos}
                onChange={handleInputChange}
                placeholder="Ej: Compresor, Motor"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Costo Mano de Obra</label>
              <input
                type="number"
                name="costoManoObra"
                value={formData.costoManoObra}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Costo Repuestos</label>
              <input
                type="number"
                name="costoRepuestos"
                value={formData.costoRepuestos}
                onChange={handleInputChange}
                step="0.01"
                min="0"
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
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="EN_PROCESO">EN PROCESO</option>
                <option value="COMPLETADO">COMPLETADO</option>
                <option value="CANCELADO">CANCELADO</option>
              </select>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                {editingService ? 'Actualizar' : 'Guardar'}
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
        title="Servicios Registrados"
        data={filteredServices}
        columns={[
          { key: 'clienteNombre', label: 'Cliente', sortable: true, filterable: true },
          { key: 'electrodomesticoMarca', label: 'Aparato', sortable: true, filterable: true },
          { key: 'tipoServicio', label: 'Tipo', sortable: true, filterable: true },
          { key: 'estado', label: 'Estado', sortable: true, filterable: true },
          { key: 'totalCosto', label: 'Costo', sortable: true, filterable: false },
          {
            key: 'acciones',
            label: 'Acciones',
            sortable: false,
            filterable: false,
            render: (service) => (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded inline-flex"
                  title="Editar"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
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
