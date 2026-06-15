import React, { useState, useEffect, useCallback } from 'react';
import api from './utils/axiosConfig';
import { useNavigate } from 'react-router-dom';
import { PencilIcon, TrashIcon, BuildingOffice2Icon, XMarkIcon } from '@heroicons/react/24/outline';
import DataTable from './DataTable';
import { usePermissions } from './utils/PermissionsContext';
import sedeService from '../api/services/sedeService';

const UserForm = ({ formData, handleInputChange, handleFormSubmit, editingId, handleCancelEdit, roles, handleDelete }) => {
  const { permissions } = usePermissions();
  const can = (c) => permissions.includes(c);
  return (
    <form onSubmit={handleFormSubmit} className="border rounded shadow-sm p-3 md:p-4 bg-white">
      <h3 className="font-bold text-base md:text-lg mb-2">
        {editingId ? 'Editar Usuario' : 'Crear Usuario'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Usuario *</label>
          <input
            type="text"
            name="username"
            placeholder="Nombre de usuario"
            value={formData.username || ''}
            onChange={handleInputChange}
            className="w-full px-2 py-1 text-xs border rounded"
            required
            readOnly={!!editingId}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Email *</label>
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email || ''}
            onChange={handleInputChange}
            className="w-full px-2 py-1 text-xs border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Teléfono</label>
          <input
            type="tel"
            name="telefono"
            placeholder="Teléfono"
            value={formData.telefono || ''}
            onChange={handleInputChange}
            className="w-full px-2 py-1 text-xs border rounded"
          />
        </div>

        {!editingId && (
          <div>
            <label className="block text-xs font-medium mb-1">Contraseña *</label>
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={formData.password || ''}
              onChange={handleInputChange}
              className="w-full px-2 py-1 text-xs border rounded"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1">Rol *</label>
          <select
            name="role"
            value={formData.role || ''}
            onChange={handleInputChange}
            className="w-full px-2 py-1 text-xs border rounded"
            required
          >
            <option value="">Seleccionar rol</option>
            {roles.map(role => (
              <option key={role.name} value={role.name}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Nombre</label>
          <input
            type="text"
            name="firstName"
            placeholder="Nombre"
            value={formData.firstName || ''}
            onChange={handleInputChange}
            className="w-full px-2 py-1 text-xs border rounded"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Apellido</label>
          <input
            type="text"
            name="lastName"
            placeholder="Apellido"
            value={formData.lastName || ''}
            onChange={handleInputChange}
            className="w-full px-2 py-1 text-xs border rounded"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-2">
        {(editingId ? can('users.update') : can('users.create')) && (
          <button type="submit" className="h-9 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium">
            {editingId ? 'Actualizar' : 'Crear'}
          </button>
        )}
        {editingId && can('users.delete') && (
          <button type="button" onClick={() => handleDelete(editingId)} className="h-9 px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-sm font-medium">
            Eliminar
          </button>
        )}
        <button type="button" onClick={handleCancelEdit} className="h-9 px-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all text-sm font-medium">
          Cancelar
        </button>
      </div>
    </form>
  );
};

const UserList = ({ data, onEdit, onDelete, onAdd }) => {
  const { permissions } = usePermissions();
  const can = (c) => permissions.includes(c);
  return (
    <div className="p-1 md:p-2">
      <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
        <h3 className="text-sm md:text-base font-bold">Listado de Usuarios</h3>
        {can('users.create') && (
          <button
            onClick={onAdd}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            Crear Usuario
          </button>
        )}
      </div>

      <DataTable
        data={data}
        columns={[
          { key: 'id', label: 'ID', sortable: true, filterable: true },
          {
            key: 'fullName',
            label: 'Nombre Completo',
            sortable: true,
            filterable: true,
            render: (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim()
          },
          { key: 'telefono', label: 'Teléfono', sortable: true, filterable: true },
          { key: 'email', label: 'Email', sortable: true, filterable: true },
          {
            key: 'role',
            label: 'Rol',
            sortable: true,
            filterable: true,
            render: (user) => (
              <span 
                className="px-2 py-1 rounded text-white text-xs font-bold"
                style={{ backgroundColor: user.roleColor || '#2563eb' }}
              >
                {user.role}
              </span>
            )
          },
          {
            key: 'acciones',
            label: '',
            sortable: false,
            filterable: false,
            width: 44,
            headerClassName: 'px-1',
            cellClassName: 'px-1',
            render: (user) => (
              <div className="flex justify-center items-center gap-1 flex-nowrap">
                {can('users.update') && (
                  <button 
                    onClick={() => onEdit(user.username)} 
                    className="inline-flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white p-1 rounded transition-colors flex-shrink-0"
                    title="Editar"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }
        ]}
      />
    </div>
  );
};

// ── Panel de asignación de sedes al usuario ──────────────────────────────────
function UserSedesPanel({ username }) {
  const { permissions } = usePermissions();
  const can = (c) => permissions.includes(c);

  const [assigned,  setAssigned]  = useState([]);
  const [allSedes,  setAllSedes]  = useState([]);
  const [selected,  setSelected]  = useState('');
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState({ text: '', isErr: false });

  const notify = (text, isErr = false) => {
    setMsg({ text, isErr });
    setTimeout(() => setMsg({ text: '', isErr: false }), 3000);
  };

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const [resAssigned, resAll] = await Promise.all([
        sedeService.getUserSedes(username),
        sedeService.list(),
      ]);
      setAssigned(Array.isArray(resAssigned.data) ? resAssigned.data : []);
      setAllSedes(Array.isArray(resAll.data)      ? resAll.data      : []);
    } catch {
      notify('No se pudieron cargar las sedes', true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { load(); }, [load]);

  const unassigned = allSedes.filter(
    (s) => s.activo !== false && !assigned.find((a) => a.codigoSede === s.codigoSede)
  );

  const handleAssign = async () => {
    if (!selected) return;
    try {
      await sedeService.assignSede(username, selected);
      notify('Sede asignada correctamente');
      setSelected('');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Error al asignar sede', true);
    }
  };

  const handleRemove = async (sedeId) => {
    try {
      await sedeService.removeSede(username, sedeId);
      notify('Sede removida correctamente');
      load();
    } catch (err) {
      notify(err.response?.data?.message || 'Error al remover sede', true);
    }
  };

  return (
    <div className="border rounded shadow-sm p-3 md:p-4 bg-white mt-3">
      <h3 className="font-bold text-sm md:text-base mb-3 flex items-center gap-2 text-gray-800">
        <BuildingOffice2Icon className="h-4 w-4 text-blue-600" />
        Sedes asignadas al usuario
      </h3>

      {msg.text && (
        <div className={`mb-2 p-2 text-xs rounded ${msg.isErr ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {msg.text}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : (
        <>
          {/* Lista de sedes asignadas */}
          <div className="mb-3 min-h-[32px]">
            {assigned.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Sin sedes asignadas.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {assigned.map((sede) => (
                  <span
                    key={sede.codigoSede}
                    className="inline-flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-2 py-1 rounded-full"
                  >
                    <BuildingOffice2Icon className="h-3 w-3 flex-shrink-0" />
                    {sede.nombreSede || sede.nombre || sede.codigoSede}
                    <span className="text-blue-400 font-mono">({sede.codigoSede})</span>
                    {can('users.update') && (
                      <button
                        type="button"
                        onClick={() => handleRemove(sede.codigoSede)}
                        className="ml-0.5 text-blue-400 hover:text-red-600 transition-colors"
                        title="Quitar sede"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Asignar nueva sede */}
          {can('users.update') && unassigned.length > 0 && (
            <div className="flex gap-2 items-center flex-wrap">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="flex-1 min-w-0 h-8 px-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar sede para asignar...</option>
                {unassigned.map((s) => (
                  <option key={s.codigoSede} value={s.codigoSede}>
                    {s.nombre} ({s.codigoSede}) — {s.ciudad || ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selected}
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              >
                Asignar
              </button>
            </div>
          )}

          {can('users.update') && unassigned.length === 0 && allSedes.length > 0 && (
            <p className="text-xs text-gray-400 italic">Todas las sedes activas ya están asignadas.</p>
          )}
        </>
      )}
    </div>
  );
}

export default function UserManager({ forceShowForm = false }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
    const [showForm, setShowForm] = useState(forceShowForm);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Cargar usuarios y roles al montar el componente
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  // Actualizar showForm cuando forceShowForm cambie
  useEffect(() => {
    setShowForm(forceShowForm);
  }, [forceShowForm]);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      alert('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/users/roles/available');
      setRoles(response.data);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      alert('Error al cargar los roles');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/users/${editingId}`, formData);
      } else {
        await api.post('/api/users', formData);
      }
      setShowForm(false);
      setFormData({});
      setEditingId(null);
      await fetchUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      alert(error.response?.data?.message || 'Error al guardar el usuario');
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await api.get(`/api/users/${id}`);
      setFormData(response.data);
      setEditingId(id);
      setShowForm(true);
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      alert('Error al cargar el usuario');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/users/${id}`);
      await fetchUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar el usuario');
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setFormData({});
    setEditingId(null);
  };

  const handleAdd = () => {
    setFormData({});
    setEditingId(null);
    setShowForm(true);
  };

  if (loading) {
    return <div className="p-4">Cargando...</div>;
  }

  return (
    <div>
      {showForm ? (
        <>
          <UserForm
            formData={formData}
            handleInputChange={handleInputChange}
            handleFormSubmit={handleFormSubmit}
            editingId={editingId}
            handleCancelEdit={handleCancelEdit}
            roles={roles}
            handleDelete={handleDelete}
          />
          {editingId && (
            <UserSedesPanel username={formData.username || editingId} />
          )}
        </>
      ) : (
        <UserList
          data={users}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
