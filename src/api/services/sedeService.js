import axiosClient from '../axiosClient';

const sedeService = {
  // ── Administración de sedes ──────────────────────────────────────────────
  list:         ()         => axiosClient.get('/api/sedes'),
  getById:      (id)       => axiosClient.get(`/api/sedes/${id}`),
  create:       (data)     => axiosClient.post('/api/sedes', data),
  update:       (id, data) => axiosClient.put(`/api/sedes/${id}`, data),
  delete:       (id)       => axiosClient.delete(`/api/sedes/${id}`),
  toggleActivo: (id)       => axiosClient.patch(`/api/sedes/${id}/toggle-activo`),

  // ── Sedes del usuario autenticado ───────────────────────────────────────
  getMisSedes: () => axiosClient.get('/api/sedes/mis-sedes'),

  // ── Asignación de sedes a usuarios (admin) ──────────────────────────────
  getUserSedes: (username)         => axiosClient.get(`/api/users/${username}/sedes`),
  assignSede:   (username, sedeId) => axiosClient.post(`/api/users/${username}/sedes/${sedeId}`),
  removeSede:   (username, sedeId) => axiosClient.delete(`/api/users/${username}/sedes/${sedeId}`),
};

export default sedeService;
