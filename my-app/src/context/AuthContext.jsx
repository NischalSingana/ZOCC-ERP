import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosConfig';
import { showToast } from '../utils/toastUtils';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    axiosInstance.post('/api/auth/logout').catch(() => {
      // Ignore errors on logout
    });
    showToast.success('Logged out successfully');
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/users/me');
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        return response.data.user;
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Error fetching user:', error);
      // Only logout if it's an authentication error (401/403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
      throw error;
    }
  }, [logout]);

  useEffect(() => {
    // Check if user is logged in on mount
    const initializeAuth = async () => {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // Verify token synchronously before finishing loading
          await fetchUser().catch(() => {
            // If token invalid, fetchUser will handle logout on 401/403
          });
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [fetchUser]);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        email,
        password,
      });

      if (response.data?.token) {
        const { token, user: userData } = response.data;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        showToast.success('Login successful!');
        return { success: true, user: userData };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isStudent = user?.role === 'STUDENT';

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    fetchUser,
    isAuthenticated,
    isAdmin,
    isStudent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

