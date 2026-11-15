import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('eldercare_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('eldercare_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const profile = await authService.getMe();
          setUser(profile);
          localStorage.setItem('eldercare_user', JSON.stringify(profile));
        } catch (err) {
          console.error("Auth token verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const saveAuthSession = (authData) => {
    setToken(authData.access_token);
    setUser(authData.user);
    localStorage.setItem('eldercare_token', authData.access_token);
    localStorage.setItem('eldercare_user', JSON.stringify(authData.user));
  };

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    saveAuthSession(data);
    return data.user;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    saveAuthSession(data);
    return data.user;
  };

  const demoLogin = async (role) => {
    const data = await authService.demoLogin(role);
    saveAuthSession(data);
    return data.user;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('eldercare_token');
    localStorage.removeItem('eldercare_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user && !!token,
        isElderly: user?.role === 'elderly',
        isCaregiver: user?.role === 'caregiver',
        login,
        register,
        demoLogin,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
