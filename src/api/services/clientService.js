import axiosClient from '../axiosClient';

const clientService = {
  list: () => axiosClient.get('/api/clientes/listar'),
  create: (data) => axiosClient.post('/api/clientes/agregar', data),
  update: (id, data) => axiosClient.put(`/api/clientes/actualizar/${id}`, data),
  remove: (id) => axiosClient.delete(`/api/clientes/eliminar/${id}`),

  getElectrodomesticos: () => axiosClient.get('/api/cliente-electrodomestico/listar'),
  addElectrodomestico: (data) => axiosClient.post('/api/cliente-electrodomestico/agregar', data),

  getCategories: () =>
    axiosClient.get('/api/client-categories/listar', { silent: true }),
};

export default clientService;
