import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../../services/api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  permissions: string[];
  lastLoginAt?: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string | string[]) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('pretty_puff_admin_token');
  });

  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem('pretty_puff_admin_user');
      if (saved) {
        return JSON.parse(saved);
      }
      const savedToken = localStorage.getItem('pretty_puff_admin_token');
      if (savedToken) {
        const parts = savedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          return {
            id: payload.id || 'admin-root',
            email: payload.email || 'admin@prettypuff.store',
            name: payload.name || 'Admin',
            role: payload.role || 'SUPER_ADMIN',
            permissions: ['*'],
          };
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const verifySession = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.auth.getProfile();
        if (response.success && response.admin) {
          setAdmin(response.admin);
          localStorage.setItem('pretty_puff_admin_user', JSON.stringify(response.admin));
        } else {
          logout();
        }
      } catch (err) {
        // If server is temporarily restarting, retain cached admin in dev mode
        console.warn('Session verification fallback to cached session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, [token]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.auth.login({ email, password });
      if (res.success && res.token) {
        setToken(res.token);
        setAdmin(res.admin);
        localStorage.setItem('pretty_puff_admin_token', res.token);
        localStorage.setItem('pretty_puff_admin_user', JSON.stringify(res.admin));
        return true;
      }
      return false;
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('pretty_puff_admin_token');
    localStorage.removeItem('pretty_puff_admin_user');
  };

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false;
    if (admin.role === 'SUPER_ADMIN') return true;
    return admin.permissions?.includes(permission) ?? false;
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!admin) return false;
    if (admin.role === 'SUPER_ADMIN') return true;
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(admin.role);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
