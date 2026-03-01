import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
  withXSRFToken: true,
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

/* ── Auth ───────────────────────────────────────────── */
export const authApi = {
  getCsrf: () => axios.get(import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '/sanctum/csrf-cookie') : '/sanctum/csrf-cookie', { withCredentials: true }),
  register: async (data) => { await authApi.getCsrf(); return api.post('/auth/register', data); },
  login: async (data) => { await authApi.getCsrf(); return api.post('/auth/login', data); },
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

/* ── Properties ─────────────────────────────────────── */
export const propertyApi = {
  list: (params) => api.get('/properties', { params }),
  show: (id) => api.get(`/properties/${id}`),
  myListings: () => api.get('/landlord/properties'),
  create: (data) => api.post('/properties', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.put(`/properties/${id}`, data),
  destroy: (id) => api.delete(`/properties/${id}`),
  requestViewing: (id) => api.post(`/properties/${id}/request-viewing`),
  approve: (id) => api.post(`/properties/${id}/approve`),
  reject: (id, reason) => api.post(`/properties/${id}/reject`, { reason }),
};

/* ── Payments ───────────────────────────────────────── */
export const paymentApi = {
  initiate: (data) => api.post('/payments/initiate', data),
  history: () => api.get('/payments/history'),
  receipt: (id) => api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
  landlordSummary: () => api.get('/payments/landlord/summary'),
};

/* ── Services ───────────────────────────────────────── */
export const serviceApi = {
  list: (params) => api.get('/services', { params }),
  show: (id) => api.get(`/services/${id}`),
  myServices: () => api.get('/provider/services'),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  destroy: (id) => api.delete(`/services/${id}`),
};

/* ── Bookings ───────────────────────────────────────── */
export const bookingApi = {
  create: (data) => api.post('/bookings', data),
  myBookings: () => api.get('/bookings/my'),
  providerBookings: () => api.get('/bookings/provider'),
  accept: (id) => api.post(`/bookings/${id}/accept`),
  decline: (id) => api.post(`/bookings/${id}/decline`),
  complete: (id) => api.post(`/bookings/${id}/complete`),
};

/* ── Messages ───────────────────────────────────────── */
export const messageApi = {
  conversations: () => api.get('/messages/conversations'),
  thread: (userId) => api.get(`/messages/conversations/${userId}`),
  send: (data) => api.post('/messages/send', data),
};

/* ── Reviews ────────────────────────────────────────── */
export const reviewApi = {
  submit: (data) => api.post('/reviews', data),
  providerReviews: (providerId) => api.get(`/reviews/provider/${providerId}`),
};

/* ── Admin ──────────────────────────────────────────── */
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: (params) => api.get('/admin/users', { params }),
  suspend: (id) => api.post(`/admin/users/${id}/suspend`),
  unsuspend: (id) => api.post(`/admin/users/${id}/unsuspend`),
  properties: (params) => api.get('/admin/properties', { params }),
  bookings: () => api.get('/admin/bookings'),
  payments: () => api.get('/admin/payments'),
  revenue: () => api.get('/admin/revenue'),
};

/* ── Notifications ──────────────────────────────────── */
export const notificationApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};

