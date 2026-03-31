import { create } from 'zustand';
import { loginApi, registerApi, getMeApi } from '../api/auth';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('nextalk_token') || null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await loginApi({ email, password });
      localStorage.setItem('nextalk_token', data.token);
      set({ user: data, token: data.token, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', loading: false });
      return false;
    }
  },

  register: async (username, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await registerApi({ username, email, password });
      localStorage.setItem('nextalk_token', data.token);
      set({ user: data, token: data.token, loading: false });
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed', loading: false });
      return false;
    }
  },

  fetchMe: async () => {
    const token = get().token;
    if (!token) return;
    try {
      const { data } = await getMeApi();
      set({ user: data });
    } catch {
      localStorage.removeItem('nextalk_token');
      set({ user: null, token: null });
    }
  },

  logout: () => {
    localStorage.removeItem('nextalk_token');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore