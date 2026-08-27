import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, UserRole } from '../types';
import { 
  authService, 
  LoginCredentials, 
  StudentRegistrationData, 
  AdminRegistrationData 
} from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, expectedRole?: UserRole) => Promise<AuthUser>;
  registerStudent: (data: StudentRegistrationData) => Promise<AuthUser>;
  registerAdmin: (data: AdminRegistrationData) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage on initial mount
    const storedToken = authService.getStoredToken();
    const storedUser = authService.getStoredUser();

    if (storedToken && storedUser) {
      setUser(storedUser);
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials, expectedRole?: UserRole): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.login(credentials, expectedRole);
      setUser(loggedUser);
      setToken(authService.getStoredToken());
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (data: StudentRegistrationData): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const newUser = await authService.registerStudent(data);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const registerAdmin = async (data: AdminRegistrationData): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const newAdmin = await authService.registerAdmin(data);
      return newAdmin;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        registerStudent,
        registerAdmin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
