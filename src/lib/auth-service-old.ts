import { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { apiClient } from '@/lib/api';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.login(credentials.email, credentials.password);
    
    if (!response.success || !response.token || !response.user) {
      throw new Error(response.error || 'Login failed');
    }

    return {
      token: response.token,
      user: response.user,
    } as AuthResponse;
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.register({
      username: credentials.username,
      email: credentials.email,
      password: credentials.password,
    });
    
    if (!response.success || !response.token || !response.user) {
      throw new Error(response.error || 'Registration failed');
    }

    return {
      token: response.token,
      user: response.user,
    } as AuthResponse;
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Registration failed');
    }

    return response.json();
  }

  // Helper method to make authenticated requests
  async authenticatedRequest(url: string, options: RequestInit = {}, token: string) {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }
}

export const authService = new AuthService();