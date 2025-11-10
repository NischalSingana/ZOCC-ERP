import axios from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../utils/apiUrl';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Set to true if using cookies
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        // Do not auto-redirect on 401; let the caller decide (AuthContext handles logout)
        toast.error('Session issue detected. Please re-login if actions fail.');
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (data?.error) {
        toast.error(data.error);
      }
    } else if (error.request) {
      // Request was made but no response received
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. The server is taking too long to respond.');
      } else {
        toast.error('Network error. Please check your connection and ensure the server is running.');
      }
      console.error('Network error details:', {
        message: error.message,
        code: error.code,
        apiUrl: API_URL,
      });
    } else {
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

