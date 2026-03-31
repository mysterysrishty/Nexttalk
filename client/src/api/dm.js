import api from './axios';

export const getMyDMsApi = () => api.get('/dms');
export const getOrCreateDMApi = (userId) => api.get(`/dms/user/${userId}`);
export const getDMMessagesApi = (conversationId, page = 1) =>
  api.get(`/dms/${conversationId}/messages?page=${page}&limit=30`);
