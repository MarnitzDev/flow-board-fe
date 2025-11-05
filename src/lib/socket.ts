'use client';

import { io, Socket } from 'socket.io-client';
import { Task } from '@/types/task';

type EventListener = (...args: unknown[]) => void;

interface ConflictData {
  taskId: string;
  serverVersion: Task;
  clientVersion: Task;
}

interface BoardSyncData {
  boardId: string;
  tasks: Task[];
}

class SocketService {
  private socket: Socket | null = null;
  private currentBoardId: string | null = null;
  private eventListeners: Map<string, EventListener[]> = new Map();
  private pendingUpdates: Map<string, Task> = new Map();
  private conflictResolver: Map<string, number> = new Map(); // Track last update times

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('flow-board-token');
        console.log('Connecting to Socket.IO with token:', token ? 'Present' : 'Missing');
        
        this.socket = io('http://localhost:5000', {
          auth: {
            token: token || ''
          },
          transports: ['websocket', 'polling'],
          forceNew: true,
          timeout: 10000
        });

        this.socket.on('connect', () => {
          console.log('Socket.IO connected successfully! ID:', this.socket?.id);
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket.IO disconnected:', reason);
        });

        this.socket.on('task:conflict', (data: ConflictData) => {
          this.handleConflict(data);
        });

        this.socket.on('board:sync', (data: BoardSyncData) => {
          this.handleBoardSync(data);
        });

      } catch (error) {
        console.error('Socket.IO connection setup error:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      if (this.currentBoardId) {
        this.socket.emit('leave:board', this.currentBoardId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentBoardId = null;
    }
  }

  // Board room management
  joinBoard(boardId: string) {
    if (!this.socket) return;
    
    if (this.currentBoardId && this.currentBoardId !== boardId) {
      this.socket.emit('leave:board', this.currentBoardId);
    }
    
    this.socket.emit('join:board', boardId);
    this.currentBoardId = boardId;
    console.log('Joined board room:', boardId);
  }

  leaveBoard() {
    if (!this.socket || !this.currentBoardId) return;
    
    this.socket.emit('leave:board', this.currentBoardId);
    this.currentBoardId = null;
    console.log('Left board room');
  }

  // Task operations
  createTask(taskData: Partial<Task>) {
    if (!this.socket) return;
    this.socket.emit('task:create', taskData);
  }

  updateTask(taskId: string, updates: Partial<Task>) {
    if (!this.socket) return;
    this.socket.emit('task:update', taskId, updates);
  }

  deleteTask(taskId: string) {
    if (!this.socket) return;
    this.socket.emit('task:delete', taskId);
  }

  moveTask(data: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
    boardId: string;
  }) {
    if (!this.socket) return;
    this.socket.emit('task:move', data);
  }

  // Event listeners
  on(event: string, callback: (...args: unknown[]) => void) {
    if (!this.socket) return;
    this.socket.on(event, callback);
  }

  off(event: string, callback?: (...args: unknown[]) => void) {
    if (!this.socket) return;
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  // Local event emission for custom events
  private emit(event: string, ...args: unknown[]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Add local event listener
  addEventListener(event: string, callback: EventListener) {
    const listeners = this.eventListeners.get(event) || [];
    listeners.push(callback);
    this.eventListeners.set(event, listeners);
  }

  // Remove local event listener
  removeEventListener(event: string, callback?: EventListener) {
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

  // User activity
  startTyping(taskId: string) {
    if (!this.socket) return;
    this.socket.emit('user:start_typing', { taskId });
  }

  stopTyping(taskId: string) {
    if (!this.socket) return;
    this.socket.emit('user:stop_typing', { taskId });
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getCurrentBoardId(): string | null {
    return this.currentBoardId;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Handle conflicts between client and server versions
  private handleConflict(data: ConflictData) {
    console.warn('Task conflict detected:', data);
    
    // Simple conflict resolution: server wins
    // In a real app, you might want to show a dialog to the user
    const event = `task:updated:${data.taskId}`;
    this.emit(event, data.serverVersion);
    
    // Remove from pending updates
    this.pendingUpdates.delete(data.taskId);
  }

  // Handle board synchronization
  private handleBoardSync(data: BoardSyncData) {
    console.log('Board sync received:', data);
    
    // Emit board sync event for components to handle
    this.emit('board:synced', data);
    
    // Clear pending updates for this board
    if (data.boardId === this.currentBoardId) {
      this.pendingUpdates.clear();
    }
  }

  // Add a task to pending updates for conflict detection
  addPendingUpdate(taskId: string, task: Task) {
    this.pendingUpdates.set(taskId, task);
    this.conflictResolver.set(taskId, Date.now());
  }

  // Remove a task from pending updates
  removePendingUpdate(taskId: string) {
    this.pendingUpdates.delete(taskId);
    this.conflictResolver.delete(taskId);
  }

  // Check if a task has pending updates
  hasPendingUpdate(taskId: string): boolean {
    return this.pendingUpdates.has(taskId);
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;