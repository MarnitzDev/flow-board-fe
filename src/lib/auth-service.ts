import { AuthResponse, LoginCredentials, RegisterCredentials } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const AUTH_ENDPOINT = `${API_BASE_URL}/api/auth`;

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_ENDPOINT}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Login failed');
    }

    return response.json();
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await fetch(`${AUTH_ENDPOINT}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
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