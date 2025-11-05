'use client';

// API Client for Flow Board Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  token?: string;
  user?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Improved API Client with Better Token Management
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Initialize token from localStorage (call this in useEffect)
  initializeToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('flowboard_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('flowboard_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('flowboard_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add Authorization header if token exists
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    console.log('Making request to:', url);
    console.log('Has token:', !!this.token);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('API Error:', result);
        throw new Error(result.error || result.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return result;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.post<ApiResponse>('/api/auth/login', { email, password });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<ApiResponse> {
    const response = await this.post<ApiResponse>('/api/auth/register', userData);

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.get<ApiResponse>('/api/auth/me');
  }

  // Project methods (these require authentication)
  async getProjects(): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.get<ApiResponse>('/api/projects');
  }

  async createProject(projectData: {
    name: string;
    description?: string;
    color?: string;
  }): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.post<ApiResponse>('/api/projects', projectData);
  }

  async updateProject(id: string, projectData: unknown): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.put<ApiResponse>(`/api/projects/${id}`, projectData);
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.delete<ApiResponse>(`/api/projects/${id}`);
  }

  // Boards API
  async getProjectBoards(projectId: string): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.get<ApiResponse>(`/api/projects/${projectId}/boards`);
  }

  // Tasks API
  async getProjectTasks(projectId: string): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.get<ApiResponse>(`/api/projects/${projectId}/tasks`);
  }

  async createTask(taskData: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    assigneeId?: string;
    projectId: string;
    boardId: string;
    columnId: string;
    dueDate?: string;
    labels?: Array<{ name: string; color: string }>;
  }): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.post<ApiResponse>('/api/tasks', taskData);
  }

  async updateTask(taskId: string, taskData: unknown): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.put<ApiResponse>(`/api/tasks/${taskId}`, taskData);
  }

  async deleteTask(taskId: string): Promise<ApiResponse> {
    if (!this.token) {
      throw new Error('No authentication token. Please login first.');
    }
    return this.delete<ApiResponse>(`/api/tasks/${taskId}`);
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient();

// Legacy API exports for backward compatibility
export const authApi = {
  login: (credentials: { email: string; password: string }) => 
    apiClient.login(credentials.email, credentials.password),
  
  register: (userData: { username: string; email: string; password: string }) => 
    apiClient.register(userData),
  
  logout: () => apiClient.clearToken(),
  
  getCurrentUser: () => apiClient.getCurrentUser()
};

export const projectsApi = {
  getAll: () => apiClient.getProjects(),
  create: (projectData: { name: string; description?: string; color: string }) => 
    apiClient.createProject(projectData),
  update: (projectId: string, projectData: unknown) => 
    apiClient.updateProject(projectId, projectData),
  delete: (projectId: string) => apiClient.deleteProject(projectId)
};

export const boardsApi = {
  getByProject: (projectId: string) => apiClient.getProjectBoards(projectId)
};

export const tasksApi = {
  getByProject: (projectId: string) => apiClient.getProjectTasks(projectId),
  create: (taskData: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    assigneeId?: string;
    projectId: string;
    boardId: string;
    columnId: string;
    dueDate?: string;
    labels?: Array<{ name: string; color: string }>;
  }) => apiClient.createTask(taskData),
  update: (taskId: string, taskData: unknown) => apiClient.updateTask(taskId, taskData),
  delete: (taskId: string) => apiClient.deleteTask(taskId)
};

// Token manager for backward compatibility
export const tokenManager = {
  getToken: () => apiClient.getToken(),
  setToken: (token: string) => apiClient.setToken(token),
  removeToken: () => apiClient.clearToken()
};