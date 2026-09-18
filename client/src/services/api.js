import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth headers
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 409 && error.response?.data?.error?.code === 'DEMO_SESSION_EXPIRED') {
      window.location.replace('/');
      return Promise.reject(error);
    }
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      // Don't redirect on participation or public pages
      const path = window.location.pathname;
      if (path !== '/login' && !path.startsWith('/participate/')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
