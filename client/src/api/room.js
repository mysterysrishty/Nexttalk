import api from './axios';

export const getRoomsApi = (search = '') =>
  api.get(`/rooms${search ? `?search=${search}` : ''}`);

export const getMyRoomsApi = () => api.get('/rooms/my');

export const getRoomByIdApi = (id) => api.get(`/rooms/${id}`);

export const createRoomApi = (data) => api.post('/rooms', data);

export const joinRoomApi = (id) => api.post(`/rooms/${id}/join`);

export const leaveRoomApi = (id) => api.post(`/rooms/${id}/leave`);

export const updateRoomApi = (id, data) => api.put(`/rooms/${id}`, data);

export const getRoomMessagesApi = (id, page = 1) =>
  api.get(`/rooms/${id}/messages?page=${page}&limit=30`)