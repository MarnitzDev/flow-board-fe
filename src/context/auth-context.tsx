'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthContextType, User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { authService } from '@/lib/auth-service';
import { authUtils } from '@/lib/auth-utils';
import { apiClient } from '@/lib/api';

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
      // Initialize the API client token
      apiClient.setToken(storedToken);
    } else {
      // Clear invalid/expired tokens
      authUtils.clearAuth();
    }

    // Always initialize the API client token from localStorage
    apiClient.initializeToken();
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      
      setToken(response.token);
      setUser(response.user);
      
      // Store in localStorage and update API client
      authUtils.setToken(response.token);
      authUtils.setUser(response.user);
      apiClient.setToken(response.token);
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
      
      // Store in localStorage and update API client
      authUtils.setToken(response.token);
      authUtils.setUser(response.user);
      apiClient.setToken(response.token);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    console.log('Starting logout process...');
    
    // Clear state first
    setToken(null);
    setUser(null);
    
    // Clear localStorage and API client
    authUtils.clearAuth();
    apiClient.clearToken();
    
    console.log('Auth state cleared, redirecting...');
    
    // Redirect to home page after logout
    if (typeof window !== 'undefined') {
      // Use replace to prevent back button issues
      window.location.replace('/');
    }
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