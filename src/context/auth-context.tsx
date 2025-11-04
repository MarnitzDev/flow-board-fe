'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthContextType, User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { authService } from '@/lib/auth-service';
import { authUtils } from '@/lib/auth-utils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = authUtils.getToken();
    const storedUser = authUtils.getUser();

    if (storedToken && authUtils.isValidToken(storedToken) && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    } else {
      // Clear invalid/expired tokens
      authUtils.clearAuth();
    }

    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      
      setToken(response.token);
      setUser(response.user);
      
      // Store in localStorage
      authUtils.setToken(response.token);
      authUtils.setUser(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.register(credentials);
      
      setToken(response.token);
      setUser(response.user);
      
      // Store in localStorage
      authUtils.setToken(response.token);
      authUtils.setUser(response.user);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    authUtils.clearAuth();
  };

  const isAuthenticated = Boolean(token && user && authUtils.isValidToken(token));

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}