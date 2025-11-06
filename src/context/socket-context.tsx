'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { socketService } from '@/lib/socket'; // Using real Socket.IO now
import { Task, Collection } from '@/types/task';

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
  
  // Collection operations
  createCollection: (collectionData: Partial<Collection>) => void;
  updateCollection: (collectionId: string, updates: Partial<Collection>) => void;
  deleteCollection: (collectionId: string) => void;
  reorderCollections: (data: {
    projectId: string;
    orders: Array<{ id: string; order: number }>;
  }) => void;
  
  // Subtask operations
  createSubtask: (parentTaskId: string, subtaskData: Partial<Task>) => void;
  updateSubtask: (subtaskId: string, updates: Partial<Task>) => void;
  deleteSubtask: (subtaskId: string) => void;
  
  // Event listeners - existing
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
  
  // Event listeners - new for collections
  onCollectionCreated: (callback: (collection: Collection) => void) => () => void;
  onCollectionUpdated: (callback: (collection: Collection) => void) => () => void;
  onCollectionDeleted: (callback: (collectionId: string) => void) => () => void;
  onCollectionReordered: (callback: (data: {
    projectId: string;
    orders: Array<{ id: string; order: number }>;
  }) => void) => () => void;
  
  // Event listeners - new for subtasks
  onSubtaskCreated: (callback: (subtask: Task) => void) => () => void;
  onSubtaskUpdated: (callback: (subtask: Task) => void) => () => void;
  onSubtaskDeleted: (callback: (subtaskId: string) => void) => () => void;
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

  // Collection operations
  const createCollection = (collectionData: Partial<Collection>) => {
    socketService.createCollection(collectionData);
  };

  const updateCollection = (collectionId: string, updates: Partial<Collection>) => {
    socketService.updateCollection(collectionId, updates);
  };

  const deleteCollection = (collectionId: string) => {
    socketService.deleteCollection(collectionId);
  };

  const reorderCollections = (data: {
    projectId: string;
    orders: Array<{ id: string; order: number }>;
  }) => {
    socketService.reorderCollections(data);
  };

  // Subtask operations
  const createSubtask = (parentTaskId: string, subtaskData: Partial<Task>) => {
    socketService.createSubtask(parentTaskId, subtaskData);
  };

  const updateSubtask = (subtaskId: string, updates: Partial<Task>) => {
    socketService.updateSubtask(subtaskId, updates);
  };

  const deleteSubtask = (subtaskId: string) => {
    socketService.deleteSubtask(subtaskId);
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

  // Collection event listeners
  const onCollectionCreated = (callback: (collection: Collection) => void) => {
    const wrappedCallback = (collection: unknown) => callback(collection as Collection);
    socketService.on('collection:created', wrappedCallback);
    return () => socketService.off('collection:created', wrappedCallback);
  };

  const onCollectionUpdated = (callback: (collection: Collection) => void) => {
    const wrappedCallback = (collection: unknown) => callback(collection as Collection);
    socketService.on('collection:updated', wrappedCallback);
    return () => socketService.off('collection:updated', wrappedCallback);
  };

  const onCollectionDeleted = (callback: (collectionId: string) => void) => {
    const wrappedCallback = (data: unknown) => callback((data as { collectionId: string }).collectionId);
    socketService.on('collection:deleted', wrappedCallback);
    return () => socketService.off('collection:deleted', wrappedCallback);
  };

  const onCollectionReordered = (callback: (data: {
    projectId: string;
    orders: Array<{ id: string; order: number }>;
  }) => void) => {
    const wrappedCallback = (data: unknown) => callback(data as {
      projectId: string;
      orders: Array<{ id: string; order: number }>;
    });
    socketService.on('collection:reordered', wrappedCallback);
    return () => socketService.off('collection:reordered', wrappedCallback);
  };

  // Subtask event listeners
  const onSubtaskCreated = (callback: (subtask: Task) => void) => {
    const wrappedCallback = (subtask: unknown) => callback(subtask as Task);
    socketService.on('subtask:created', wrappedCallback);
    return () => socketService.off('subtask:created', wrappedCallback);
  };

  const onSubtaskUpdated = (callback: (subtask: Task) => void) => {
    const wrappedCallback = (subtask: unknown) => callback(subtask as Task);
    socketService.on('subtask:updated', wrappedCallback);
    return () => socketService.off('subtask:updated', wrappedCallback);
  };

  const onSubtaskDeleted = (callback: (subtaskId: string) => void) => {
    const wrappedCallback = (data: unknown) => callback((data as { subtaskId: string }).subtaskId);
    socketService.on('subtask:deleted', wrappedCallback);
    return () => socketService.off('subtask:deleted', wrappedCallback);
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
    createCollection,
    updateCollection,
    deleteCollection,
    reorderCollections,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onTaskMoved,
    onCollectionCreated,
    onCollectionUpdated,
    onCollectionDeleted,
    onCollectionReordered,
    onSubtaskCreated,
    onSubtaskUpdated,
    onSubtaskDeleted,
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