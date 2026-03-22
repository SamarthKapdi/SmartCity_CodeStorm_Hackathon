import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Add JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartcity_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('smartcity_token');
      localStorage.removeItem('smartcity_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getUsers: (params) => api.get('/auth/users', { params }),
  getOperators: () => api.get('/auth/operators'),
  createUser: (data) => api.post('/auth/users', data)
};

// Dashboard API
export const dashboardAPI = {
  getData: () => api.get('/dashboard'),
  predict: () => api.post('/dashboard/predict')
};

// Traffic API
export const trafficAPI = {
  getAll: (params) => api.get('/traffic', { params }),
  getStats: () => api.get('/traffic/stats'),
  create: (data) => api.post('/traffic', data),
  update: (id, data) => api.put(`/traffic/${id}`, data),
  reportIncident: (id, data) => api.post(`/traffic/${id}/report-incident`, data),
  emergencyOverride: (id) => api.post(`/traffic/${id}/emergency-override`),
  clearOverride: (id) => api.post(`/traffic/${id}/clear-override`),
  predict: (zone) => api.get(`/traffic/predict/${zone}`)
};

// Waste API
export const wasteAPI = {
  getAll: (params) => api.get('/waste', { params }),
  getStats: () => api.get('/waste/stats'),
  create: (data) => api.post('/waste', data),
  update: (id, data) => api.put(`/waste/${id}`, data),
  collect: (id) => api.post(`/waste/${id}/collect`),
  optimizeRoutes: (zone) => api.post(`/waste/optimize-routes/${zone}`),
  detectMissed: () => api.post('/waste/detect-missed')
};

// Water API
export const waterAPI = {
  getAll: (params) => api.get('/water', { params }),
  getStats: () => api.get('/water/stats'),
  create: (data) => api.post('/water', data),
  update: (id, data) => api.put(`/water/${id}`, data),
  getAnalytics: (zone) => api.get(`/water/analytics/${zone}`),
  analyze: (zone) => api.post(`/water/analyze/${zone}`)
};

// Lighting API
export const lightingAPI = {
  getAll: (params) => api.get('/lighting', { params }),
  getStats: () => api.get('/lighting/stats'),
  create: (data) => api.post('/lighting', data),
  toggle: (id) => api.put(`/lighting/${id}/toggle`),
  toggleAutoMode: (id) => api.put(`/lighting/${id}/auto-mode`),
  reportFault: (id, data) => api.post(`/lighting/${id}/report-fault`, data),
  resolveFault: (id) => api.post(`/lighting/${id}/resolve-fault`),
  autoToggle: () => api.post('/lighting/auto-toggle')
};

// Incidents API
export const incidentAPI = {
  getAll: (params) => api.get('/incidents', { params }),
  getStats: () => api.get('/incidents/stats'),
  create: (data) => api.post('/incidents', data),
  update: (id, data) => api.put(`/incidents/${id}`, data),
  assign: (id, data) => api.put(`/incidents/${id}/assign`, data),
  delete: (id) => api.delete(`/incidents/${id}`)
};

// Alerts API
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  markRead: (id) => api.put(`/alerts/${id}/read`),
  acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
  markAllRead: () => api.put('/alerts/read-all'),
  delete: (id) => api.delete(`/alerts/${id}`)
};

// Logs API
export const logAPI = {
  getAll: (params) => api.get('/logs', { params })
};

// Complaints API
export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getStats: () => api.get('/complaints/stats'),
  getOne: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  assign: (id, data) => api.put(`/complaints/${id}/assign`, data),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  suggestOperator: (params) => api.get('/complaints/suggest-operator', { params }),
  checkOverdue: () => api.post('/complaints/overdue/check')
};

// Citizen Chat Assistant API
export const chatAPI = {
  askAssistant: (data) => api.post('/chat/assistant', data)
};

// Announcements API
export const announcementAPI = {
  getAll: (params) => api.get('/announcements', { params }),
  create: (data) => api.post('/announcements', data),
  update: (id, data) => api.put(`/announcements/${id}`, data),
  delete: (id) => api.delete(`/announcements/${id}`),
  recordView: (id) => api.post(`/announcements/${id}/view`)
};

export default api;
