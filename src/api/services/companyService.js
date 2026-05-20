import axiosClient from '../axiosClient';

const companyService = {
  getInfo: () => axiosClient.get('/api/company/info'),

  getLogo: (companyId) =>
    axiosClient.get(`/api/company/${companyId}/logo`, { responseType: 'blob' }),

  getLogo2: (companyId) =>
    axiosClient.get(`/api/company/${companyId}/logo2`, { responseType: 'blob' }),

  update: (data) => axiosClient.put('/api/company/update', data),

  updateLogo: (companyId, formData) =>
    axiosClient.post(`/api/company/${companyId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default companyService;
