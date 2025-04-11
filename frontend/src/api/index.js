import axios from 'axios';

// Use the deployed Render URL for the backend
const BACKEND_URL = 'https://realestate360-e5sb.onrender.com';

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
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
    // Log all API errors in development
    console.error('API Error:', error.response || error.message || error);
    
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