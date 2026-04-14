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

// Global response unwrapper and 401 handler
api.interceptors.response.use(
  (res) => {
    // Unwrap the backend ApiResponse { success, message, data, errors }
    if (res.data && res.data.success === true && res.data.data !== undefined) {
      res.data = res.data.data;
    }
    return res;
  },
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
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  googleCallback: (data) => api.post('/auth/google/callback', data),
  googleCompleteSignup: (data) => api.post('/auth/google/complete-signup', data),
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
  verify: (id) => api.post(`/admin/users/${id}/verify`),
  properties: (params) => api.get('/admin/properties', { params }),
  bookings: () => api.get('/admin/bookings'),
  payments: () => api.get('/admin/payments'),
  revenue: () => api.get('/admin/revenue'),
  getServices: (params) => api.get('/admin/services', { params }),
  approveService: (id) => api.post(`/admin/services/${id}/approve`),
  rejectService: (id) => api.post(`/admin/services/${id}/reject`),
};

/* ── Notifications ──────────────────────────────────── */
export const notificationApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
};



const fileApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  withXSRFToken: true,
});
fileApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
fileApi.interceptors.response.use(
  (res) => {
    if (res.data && res.data.success === true && res.data.data !== undefined) {
      res.data = res.data.data;
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

/* -- Tenant Profile & History ------------------- */
export const tenantProfileApi = {
  get: () => api.get('/tenant/profile'),
  update: (data) => api.put('/tenant/profile', data),
  uploadAvatar: async (form) => fileApi.post('/tenant/profile/avatar', form),
  history: (page) => api.get('/tenant/profile/history', { params: { page } }),
  recentViews: () => api.get('/tenant/profile/views/recent'),
  recordView: (id) => api.post(`/tenant/profile/views/${id}`),
};

/* -- Landlord Profile --------------------------- */
export const landlordProfileApi = {
  get: () => api.get('/landlord/profile'),
  update: (data) => api.put('/landlord/profile', data),
  uploadAvatar: (form) => fileApi.post('/landlord/profile/avatar', form),
};

/* -- Provider Profile --------------------------- */
export const providerProfileApi = {
  get: () => api.get('/provider/profile'),
  update: (data) => api.put('/provider/profile', data),
  uploadAvatar: (form) => fileApi.post('/provider/profile/avatar', form),
};

