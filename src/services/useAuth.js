// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загружаем данные пользователя один раз при монтировании
  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      
      try {
        setLoading(true);
        const userData = await authAPI.getMe();
        setUser(userData);
      } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        setError(error.message);
        // Не делаем logout при ошибке - это позволит продолжать работать
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []); // Только при первом рендере

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('dashboardCurrentContent');
    setUser(null);
    setError(null);
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authAPI.login(credentials);
      localStorage.setItem('authToken', response.token);
      
      // Загружаем данные пользователя после успешного входа
      const userData = await authAPI.getMe();
      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
    login
  };
}