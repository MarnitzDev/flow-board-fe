'use client';

import { Task } from '@/types/task';

type EventListener = (...args: unknown[]) => void;

interface MockSocketEvents {
  'task:created': (task: Task) => void;
  'task:updated': (task: Task) => void;
  'task:deleted': (taskId: string) => void;
  'task:moved': (data: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
    boardId: string;
  }) => void;
  'user:joined': (user: { userId: string; username: string }) => void;
  'user:left': (userId: string) => void;
  'user:typing': (data: { userId: string; username: string; taskId: string }) => void;
  'user:stop_typing': (data: { userId: string; taskId: string }) => void;
  'board:synced': (data: { boardId: string; tasks: Task[] }) => void;
}

class MockSocketService {
  private eventListeners: Map<string, EventListener[]> = new Map();
  private connected = false;
  private currentBoardId: string | null = null;
  private mockUsers: Array<{ userId: string; username: string }> = [];
  private typingUsers: Array<{ userId: string; username: string; taskId: string }> = [];

  async connect(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate connection delay
      setTimeout(() => {
        this.connected = true;
        console.log('Mock Socket connected');
        this.emit('connect');
        resolve();
      }, 500);
    });
  }

  disconnect() {
    this.connected = false;
    this.currentBoardId = null;
    this.mockUsers = [];
    this.typingUsers = [];
    console.log('Mock Socket disconnected');
    this.emit('disconnect');
  }

  joinBoard(boardId: string) {
    this.currentBoardId = boardId;
    console.log('Mock: Joined board room:', boardId);
    
    // Simulate other users joining
    setTimeout(() => {
      const mockUser = { 
        userId: 'mock-user-1', 
        username: 'Demo User' 
      };
      this.mockUsers.push(mockUser);
      this.emit('user:joined', mockUser);
    }, 1000);
  }

  leaveBoard() {
    if (this.currentBoardId) {
      console.log('Mock: Left board room:', this.currentBoardId);
      this.currentBoardId = null;
      this.mockUsers = [];
      this.typingUsers = [];
      this.emit('user:left', 'mock-user-1');
    }
  }

  // Task operations - simulate API calls and emit events
  createTask(taskData: Partial<Task>) {
    if (!this.connected) return;
    
    console.log('Mock: Creating task:', taskData);
    
    // Simulate API call delay and response
    setTimeout(() => {
      const newTask: Task = {
        _id: `mock-task-${Date.now()}`,
        title: taskData.title || 'New Task',
        description: taskData.description || '',
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        boardId: taskData.boardId || this.currentBoardId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.emit('task:created', newTask);
    }, 300);
  }

  updateTask(taskId: string, updates: Partial<Task>) {
    if (!this.connected) return;
    
    console.log('Mock: Updating task:', taskId, updates);
    
    setTimeout(() => {
      const updatedTask: Task = {
        _id: taskId,
        title: updates.title || 'Updated Task',
        description: updates.description || '',
        status: updates.status || 'todo',
        priority: updates.priority || 'medium',
        boardId: updates.boardId || this.currentBoardId || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updates
      };
      
      this.emit('task:updated', updatedTask);
    }, 200);
  }

  deleteTask(taskId: string) {
    if (!this.connected) return;
    
    console.log('Mock: Deleting task:', taskId);
    
    setTimeout(() => {
      this.emit('task:deleted', taskId);
    }, 200);
  }

  moveTask(data: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
    boardId: string;
  }) {
    if (!this.connected) return;
    
    console.log('Mock: Moving task:', data);
    
    setTimeout(() => {
      this.emit('task:moved', data);
    }, 150);
  }

  // User activity simulation
  startTyping(taskId: string) {
    if (!this.connected) return;
    
    const typingData = {
      userId: 'current-user',
      username: 'You',
      taskId
    };
    
    console.log('Mock: Start typing:', typingData);
    
    // Simulate someone else typing after a delay
    setTimeout(() => {
      const otherUser = {
        userId: 'mock-user-1',
        username: 'Demo User',
        taskId
      };
      
      if (!this.typingUsers.some(u => u.userId === otherUser.userId && u.taskId === taskId)) {
        this.typingUsers.push(otherUser);
        this.emit('user:typing', otherUser);
        
        // Stop typing after 3 seconds
        setTimeout(() => {
          this.typingUsers = this.typingUsers.filter(
            u => !(u.userId === otherUser.userId && u.taskId === taskId)
          );
          this.emit('user:stop_typing', { userId: otherUser.userId, taskId });
        }, 3000);
      }
    }, 1000);
  }

  stopTyping(taskId: string) {
    if (!this.connected) return;
    console.log('Mock: Stop typing:', taskId);
  }

  // Event system
  on(event: string, callback: EventListener) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  off(event: string, callback?: EventListener) {
    if (!callback) {
      this.eventListeners.delete(event);
      return;
    }
    
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const filtered = listeners.filter(l => l !== callback);
      this.eventListeners.set(event, filtered);
    }
  }

  private emit(event: string, ...args: unknown[]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error('Error in mock event listener:', error);
        }
      });
    }
  }

  // Status methods
  isConnected(): boolean {
    return this.connected;
  }

  getCurrentBoardId(): string | null {
    return this.currentBoardId;
  }

  getMockUsers(): Array<{ userId: string; username: string }> {
    return [...this.mockUsers];
  }

  getTypingUsers(): Array<{ userId: string; username: string; taskId: string }> {
    return [...this.typingUsers];
  }
}

// Export singleton instance
export const mockSocketService = new MockSocketService();
export default mockSocketService;