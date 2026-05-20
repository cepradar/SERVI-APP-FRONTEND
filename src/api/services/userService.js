import axiosClient from '../axiosClient';

const userService = {
  list: () => axiosClient.get('/auth/users/list'),
  create: (data) => axiosClient.post('/auth/register', data),
  update: (id, data) => axiosClient.put(`/auth/users/${id}`, data),
  remove: (id) => axiosClient.delete(`/auth/users/${id}`),
  getRoles: () => axiosClient.get('/api/roles'),
};

export default userService;
