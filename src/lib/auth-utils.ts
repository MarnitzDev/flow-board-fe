import { User } from '@/types/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export const authUtils = {
  // Token management
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  // User management
  setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(USER_KEY);
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  },

  removeUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  },

  // Clear all auth data
  clearAuth(): void {
    this.removeToken();
    this.removeUser();
  },

  // Check if token is expired (basic check)
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  },

  // Validate token
  isValidToken(token: string | null): boolean {
    if (!token) return false;
    return !this.isTokenExpired(token);
  }
};