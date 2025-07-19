import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: 'resident' | 'authority') => void;
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
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'resident',
    address: '123 Main St, City, State',
    phone: '+1 (555) 123-4567'
  });

  const login = async (email: string, password: string) => {
    // Simulate login
    setUser({
      id: '1',
      name: 'John Doe',
      email,
      role: 'resident',
      address: '123 Main St, City, State',
      phone: '+1 (555) 123-4567'
    });
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: 'resident' | 'authority') => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};