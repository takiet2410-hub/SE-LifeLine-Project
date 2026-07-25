import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AuthUser } from '../../modules/auth-account/types';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  login: (token: string, userData?: AuthUser) => void;
  logout: () => void;
  updateUser: (userData: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Khởi tạo đồng bộ để tránh ProtectedRoute bị flash-redirect ở render đầu tiên
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  const login = useCallback((newToken: string, userData?: AuthUser) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    // BUG-07 FIX: populate user ngay khi login nếu có userData
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('resetToken');
    setToken(null);
    setUser(null);
  }, []);

  // Cho phép cập nhật user sau khi fetch profile
  const updateUser = useCallback((userData: AuthUser) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
