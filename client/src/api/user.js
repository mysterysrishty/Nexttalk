import api from './axios';

export const searchUsersApi = (q) => api.get(`/users/search?q=${q}`);
export const getUserByIdApi = (id) => api.get(`/users/${id}`);
export const updateProfileApi = (data) => api.put('/users/profile', data);
export const uploadFileApi = (formData) =>
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });