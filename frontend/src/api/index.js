import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000', // Change this to your deployed backend URL in production
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors (401, 403, etc)
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      localStorage.removeItem('userEmail');
      // You could redirect to login page here if needed
    }
    return Promise.reject(error);
  }
);

export default api; 