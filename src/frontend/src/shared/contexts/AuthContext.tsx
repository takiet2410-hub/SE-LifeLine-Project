import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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

const normalizeUser = (userData?: AuthUser | null): AuthUser | null => {
  if (!userData) return null;
  const uid = userData.id || userData._id || '';
  return {
    ...userData,
    id: uid,
    _id: uid,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Khởi tạo đồng bộ để tránh ProtectedRoute bị flash-redirect ở render đầu tiên
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return normalizeUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  // Lắng nghe thay đổi auth từ các tab khác trong cùng trình duyệt
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'user') {
        const storedToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(normalizeUser(JSON.parse(storedUser)));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback((newToken: string, userData?: AuthUser) => {
    localStorage.setItem('accessToken', newToken);
    setToken(newToken);
    // BUG-07 FIX: populate user ngay khi login nếu có userData
    if (userData) {
      const normalized = normalizeUser(userData);
      localStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);
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
    const normalized = normalizeUser(userData);
    if (normalized) {
      localStorage.setItem('user', JSON.stringify(normalized));
      setUser(normalized);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, token, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
