import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  profile?: {
    blood_group?: string;
    allergies?: string[];
    date_of_birth?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  selectedPatientId: number | null;
  setSelectedPatientId: (id: number | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          setSelectedPatientId(userData.id);
        })
        .catch(() => {
          logout();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, pass: string) => {
    const data = await api.login({ email, password: pass });
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    const profile = await api.getMe();
    setUser(profile);
    setSelectedPatientId(profile.id);
  };

  const register = async (userData: any) => {
    await api.register(userData);
    await login(userData.email, userData.password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSelectedPatientId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        selectedPatientId,
        setSelectedPatientId,
        isLoading,
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
