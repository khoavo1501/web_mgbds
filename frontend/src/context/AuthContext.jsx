import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Thêm loading state

  useEffect(() => {
    // Load from localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('Restored user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false); // Đánh dấu đã load xong
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const data = response.data.data;
        const newUser = {
          token: data.token,
          userId: data.userId, // Đổi từ id thành userId
          email: data.email,
          fullName: data.fullName,
          role: data.role
        };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
        return { success: true };
      } else {
        return { success: false, message: response.data.message || 'Đăng nhập thất bại' };
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        return { success: false, message: error.response.data.message };
      }
      return { success: false, message: 'Lỗi kết nối đến máy chủ' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
