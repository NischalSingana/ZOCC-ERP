import axios from 'axios';
import { showToast } from '../utils/toastUtils';
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
    // Skip toast for login/auth endpoints - let components handle those errors
    const isAuthEndpoint = error.config?.url?.includes('/api/auth/login') || 
                          error.config?.url?.includes('/api/auth/register') ||
                          error.config?.url?.includes('/api/auth/forgot-password');
    
    if (error.response) {
      const { status, data } = error.response;
      
      // Skip toast notifications for auth endpoints - components will show specific messages
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
      
      if (status === 401) {
        // Only show toast for authenticated routes, not login failures
        showToast.error('Session expired. Please log in again.');
      } else if (status === 403) {
        showToast.error('You do not have permission to perform this action.');
      } else if (status >= 500) {
        showToast.error('Server error. Please try again later.');
      } else if (status === 400 && data?.error) {
        // Show validation errors
        showToast.error(data.error);
      }
    } else if (error.request) {
      // Request was made but no response received
      if (!isAuthEndpoint) {
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          showToast.error('Request timeout. The server is taking too long to respond.');
        } else {
          showToast.error('Network error. Please check your connection and ensure the server is running.');
        }
      }
      console.error('Network error details:', {
        message: error.message,
        code: error.code,
        apiUrl: API_URL,
      });
    } else if (!isAuthEndpoint) {
      showToast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

