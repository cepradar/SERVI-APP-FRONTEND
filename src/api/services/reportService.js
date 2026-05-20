import axiosClient from '../axiosClient';

const reportService = {
  list: () => axiosClient.get('/api/reportes'),
  upload: (formData) =>
    axiosClient.post('/api/reportes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) => axiosClient.put(`/api/reportes/${id}`, data),
  toggleStatus: (id, activo) =>
    axiosClient.patch(`/api/reportes/${id}/estado`, { activo }),
  remove: (id) => axiosClient.delete(`/api/reportes/${id}`),
  download: (id, type) =>
    axiosClient.get(`/api/reportes/${id}/download/${type}`, {
      responseType: 'blob',
    }),
  preview: (id) =>
    axiosClient.get(`/api/reportes/${id}/preview`, { responseType: 'blob' }),
};

export default reportService;
