'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { socketService } from '@/lib/socket'; // Using real Socket.IO now
import { Task } from '@/types/task';

interface SocketContextType {
  isConnected: boolean;
  activeUsers: Array<{ userId: string; username: string }>;
  typingUsers: Array<{ userId: string; username: string; taskId: string }>;
  
  // Board operations
  joinBoard: (boardId: string) => void;
  leaveBoard: () => void;
  
  // Task operations
  createTask: (taskData: Partial<Task>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  moveTask: (data: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
    boardId: string;
  }) => void;
  
  // Event listeners
  onTaskCreated: (callback: (task: Task) => void) => () => void;
  onTaskUpdated: (callback: (task: Task) => void) => () => void;
  onTaskDeleted: (callback: (taskId: string) => void) => () => void;
  onTaskMoved: (callback: (data: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
    boardId: string;
  }) => void) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { isAuthenticated, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Array<{ userId: string; username: string }>>([]);
  const [typingUsers, setTypingUsers] = useState<Array<{ userId: string; username: string; taskId: string }>>([]);

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketService.disconnect();
      return;
    }

    console.log('Initializing Socket.IO connection...');
    socketService.connect().then(() => {
      setIsConnected(socketService.isConnected());
    }).catch((error) => {
      console.error('Socket connection failed:', error);
      setIsConnected(false);
    });
    
    // Connection status handlers
    socketService.on('connect', () => {
      console.log('Socket.IO connected successfully');
      setIsConnected(true);
    });

    socketService.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
      setActiveUsers([]);
      setTypingUsers([]);
    });

    // User presence handlers
    socketService.on('user:joined', (...args: unknown[]) => {
      const data = args[0] as { userId: string; username: string; boardId: string };
      console.log('User joined:', data);
      setActiveUsers(prev => {
        const exists = prev.find(u => u.userId === data.userId);
        if (!exists) {
          return [...prev, { userId: data.userId, username: data.username }];
        }
        return prev;
      });
    });

    socketService.on('user:left', (...args: unknown[]) => {
      const data = args[0] as { userId: string; boardId: string };
      console.log('User left:', data);
      setActiveUsers(prev => prev.filter(u => u.userId !== data.userId));
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    socketService.on('user:typing', (...args: unknown[]) => {
      const data = args[0] as { userId: string; username: string; taskId: string };
      setTypingUsers(prev => {
        const filtered = prev.filter(u => !(u.userId === data.userId && u.taskId === data.taskId));
        return [...filtered, data];
      });
    });

    socketService.on('user:stop_typing', (...args: unknown[]) => {
      const data = args[0] as { userId: string; taskId: string };
      setTypingUsers(prev => prev.filter(u => !(u.userId === data.userId && u.taskId === data.taskId)));
    });

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, token]);

    // Board operations
  const joinBoard = (boardId: string) => {
    socketService.joinBoard(boardId);
  };

  const leaveBoard = () => {
    socketService.leaveBoard();
  };

  // Task operations
  const createTask = (taskData: Partial<Task>) => {
    socketService.createTask(taskData);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    socketService.updateTask(taskId, updates);
  };

  const deleteTask = (taskId: string) => {
    socketService.deleteTask(taskId);
  };

  const moveTask = (data: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
    boardId: string;
  }) => {
    socketService.moveTask(data);
  };

  // Event listener helpers that return cleanup functions
  const onTaskCreated = (callback: (task: Task) => void) => {
    const wrappedCallback = (task: unknown) => callback(task as Task);
    socketService.on('task:created', wrappedCallback);
    return () => socketService.off('task:created', wrappedCallback);
  };

  const onTaskUpdated = (callback: (task: Task) => void) => {
    const wrappedCallback = (task: unknown) => callback(task as Task);
    socketService.on('task:updated', wrappedCallback);
    return () => socketService.off('task:updated', wrappedCallback);
  };

  const onTaskDeleted = (callback: (taskId: string) => void) => {
    const wrappedCallback = (taskId: unknown) => callback(taskId as string);
    socketService.on('task:deleted', wrappedCallback);
    return () => socketService.off('task:deleted', wrappedCallback);
  };

  const onTaskMoved = (callback: (data: {
    taskId: string;
    fromColumnId: string;
    toColumnId: string;
    newIndex: number;
    boardId: string;
  }) => void) => {
    const wrappedCallback = (data: unknown) => callback(data as {
      taskId: string;
      fromColumnId: string;
      toColumnId: string;
      newIndex: number;
      boardId: string;
    });
    socketService.on('task:moved', wrappedCallback);
    return () => socketService.off('task:moved', wrappedCallback);
  };

  const value: SocketContextType = {
    isConnected,
    activeUsers,
    typingUsers,
    joinBoard,
    leaveBoard,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskMoved,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}