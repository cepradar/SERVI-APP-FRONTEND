import axiosClient from '../axiosClient';

const authService = {
  login: (username, password) =>
    axiosClient.post('/auth/login', { username, password }),

  register: (data) => axiosClient.post('/auth/register', data),

  getProfilePicture: (username) =>
    axiosClient.get(`/auth/profile-picture/${username}`, {
      responseType: 'arraybuffer',
      timeout: 8000,
      silent: true,
    }),

  getPermissions: () => axiosClient.get('/api/permissions/me'),
};

export default authService;
