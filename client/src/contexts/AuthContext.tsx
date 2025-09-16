import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      apiClient.setToken(storedToken);
      // Verify token and get user info
      apiClient.getCurrentUser()
        .then(({ user }) => {
          setUser(user);
        })
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
          apiClient.setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { token: newToken, user: newUser } = await apiClient.login({ email, password });
      
      setToken(newToken);
      setUser(newUser);
      apiClient.setToken(newToken);
      localStorage.setItem('token', newToken);
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role = 'citizen') => {
    try {
      const { token: newToken, user: newUser } = await apiClient.register({ name, email, password, role });
      
      setToken(newToken);
      setUser(newUser);
      apiClient.setToken(newToken);
      localStorage.setItem('token', newToken);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    apiClient.setToken(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

