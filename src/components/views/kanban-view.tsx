'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';
import { TaskFilter, TaskSort, Task, Project, Board, Column, Collection, CreateCollectionForm } from '@/types/task';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { tasksApi } from '@/lib/api';
import { CollectionDialog } from '@/components/collections/collection-dialog';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanViewProps {
  filters?: TaskFilter;
  sorting?: TaskSort;
  onTaskClick: (task?: Task) => void;
  currentProject?: Project;
  currentBoard?: Board;
}

export function KanbanView({ onTaskClick, currentProject }: KanbanViewProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  
  // Collection management state
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | undefined>(undefined);
  
  // Collection filtering state
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState<string | null>(null); // null = all, 'none' = no collection, or collection ID
  
  // Drag and drop state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Helper function to match task IDs (handles both _id and id formats)
  const taskMatches = useCallback((task: Task, targetId: string): boolean => {
    // CRITICAL: If targetId is undefined/null/empty, don't match anything
    if (!targetId) {
      console.warn('⚠️ taskMatches called with invalid targetId:', targetId);
      return false;
    }
    
    const matches = task.id === targetId || 
           (task as { _id?: string })._id === targetId;
    
    if (matches) {
      console.log('🎯 Task ID match found:', {
        taskId: task.id,
        taskTitle: task.title,
        targetId: targetId,
        exactMatch: task.id === targetId,
        idMatch: (task as { _id?: string })._id === targetId
      });
    }
    
    return matches;
  }, []);
  
  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  const { isAuthenticated, token } = useAuth();
  const { 
    isConnected, 
    joinBoard, 
    leaveBoard, 
    moveTask,
    onTaskCreated, 
    onTaskUpdated, 
    onTaskDeleted, 
    onTaskMoved,
    activeUsers,
    typingUsers
  } = useSocket();
  
  console.log('🔌 Socket connection status in KanbanBoard:', { isConnected });
  console.log('🎯 Socket functions available:', { 
    hasJoinBoard: !!joinBoard, 
    hasMoveTask: !!moveTask, 
    hasOnTaskUpdated: !!onTaskUpdated 
  });

  // Fetch tasks when project changes
  useEffect(() => {
    console.log('🚀 KanbanBoard useEffect triggered. Socket status:', { isConnected, hasProject: !!currentProject, isAuthenticated, hasToken: !!token });
    
    const fetchData = async () => {
      if (!currentProject || !isAuthenticated || !token) {
        console.log('KanbanBoard: Missing requirements:', { 
          hasProject: !!currentProject, 
          isAuthenticated, 
          hasToken: !!token 
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('KanbanBoard: Fetching data for project:', currentProject.id);
        console.log('KanbanBoard: Authentication details:', {
          isAuthenticated,
          hasToken: !!token,
          tokenLength: token?.length,
          tokenPreview: token ? `${token.substring(0, 50)}...` : 'No token',
          projectId: currentProject.id
        });
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Fetch real board data from backend
        try {
          console.log('Fetching boards for project:', currentProject.id);
          console.log('Using token:', token ? `${token.substring(0, 30)}...` : 'No token');
          
          // Fetch collections and boards in parallel
          const [boardsResponse, collectionsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/boards?projectId=${currentProject.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }),
            fetch(`${API_BASE_URL}/api/collections/project/${currentProject.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
          ]);
          
          console.log('Boards response status:', boardsResponse.status);
          console.log('Collections response status:', collectionsResponse.status);
          
          // Handle collections
          if (collectionsResponse.ok) {
            const collectionsData = await collectionsResponse.json();
            console.log('Collections API response:', collectionsData);
            
            if (collectionsData.success && Array.isArray(collectionsData.data)) {
              // Transform collections to frontend format
              const transformedCollections: Collection[] = collectionsData.data.map((collection: any) => ({
                id: collection._id,
                name: collection.name,
                description: collection.description,
                color: collection.color,
                projectId: collection.projectId,
                createdBy: collection.createdBy,
                order: collection.order,
                isArchived: collection.isArchived,
                createdAt: new Date(collection.createdAt),
                updatedAt: new Date(collection.updatedAt)
              }));
              
              setCollections(transformedCollections);
              console.log('✅ Successfully loaded collections:', transformedCollections.length);
              console.log('Collections data:', transformedCollections);
            }
          } else {
            console.log('⚠️ Collections response not ok, status:', collectionsResponse.status);
            console.log('⚠️ Collections API endpoint not implemented yet');
            setCollections([]);
          }
          console.log('Boards response ok:', boardsResponse.ok);
          
          if (boardsResponse.ok) {
            const boardsData = await boardsResponse.json();
            console.log('Boards API response:', boardsData);
            
            if (boardsData.success && boardsData.data && boardsData.data.length > 0) {
              // Use the first board for this project
              const board = boardsData.data[0];
              console.log('Using board:', board.name);
              
              // Transform board columns to frontend format
              const boardColumns: Column[] = board.columns.map((col: any) => ({
                id: col._id,
                name: col.name,
                color: col.color,
                order: col.order,
                taskIds: col.taskIds || []
              }));
              
              // Sort columns by order
              boardColumns.sort((a, b) => a.order - b.order);
              setColumns(boardColumns);
              setCurrentBoardId(board._id);
              console.log('🏷️ Setting current board ID:', board._id);
              console.log('✅ Successfully loaded real board columns:', boardColumns.map(c => `${c.name} (${c.taskIds.length} tasks)`));
              
              // Join the board room for real-time updates
              if (isConnected) {
                console.log('🔗 Joining board room for real-time updates:', board._id);
                joinBoard(board._id);
                console.log('✅ Board room join requested');
              } else {
                console.log('⚠️ Socket not connected, cannot join board room. Connection status:', isConnected);
              }
              
              // Now fetch tasks for this board using the optimized endpoint
              try {
                const boardId = board._id;
                console.log('Fetching tasks for board:', boardId);
                
                const tasksResponse = await fetch(`${API_BASE_URL}/api/tasks/board/${boardId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (tasksResponse.ok) {
                  const tasksData = await tasksResponse.json();
                  console.log('Board Tasks API response:', tasksData);
                  
                  if (tasksData && tasksData.success && Array.isArray(tasksData.data)) {
                    // Transform API response to match frontend types
                    const transformedTasks: Task[] = tasksData.data.map((task: any) => ({
                      id: task._id,
                      title: task.title,
                      description: task.description || '',
                      status: task.status,
                      priority: task.priority,
                      assignee: task.assignee ? {
                        id: task.assignee._id,
                        username: task.assignee.username,
                        email: task.assignee.email,
                        role: 'user' as const,
                        avatar: task.assignee.avatar
                      } : undefined,
                      reporter: {
                        id: task.reporter._id,
                        username: task.reporter.username,
                        email: task.reporter.email,
                        role: 'user' as const,
                        avatar: task.reporter.avatar
                      },
                      projectId: task.projectId._id || task.projectId,
                      boardId: task.boardId._id || task.boardId,
                      columnId: task.columnId,
                      collectionId: task.collectionId || undefined, // New field
                      parentTaskId: task.parentTaskId || undefined, // New field  
                      isSubtask: task.isSubtask || false, // New field
                      order: task.order || 0, // New field
                      createdBy: task.createdBy || task.reporter._id, // New field
                      labels: task.labels || [],
                      startDate: task.startDate ? new Date(task.startDate) : undefined, // Enhanced field
                      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                      createdAt: new Date(task.createdAt),
                      updatedAt: new Date(task.updatedAt),
                      subtasks: task.subtasks || [],
                      comments: task.comments || [],
                      attachments: task.attachments || [],
                      timeTracked: task.timeTracked || 0,
                      dependencies: task.dependencies || []
                    }));
                    
                    setTasks(transformedTasks);
                    console.log(`Successfully loaded ${transformedTasks.length} real tasks for board!`);
                  } else {
                    console.log('No tasks data in response');
                    setTasks([]);
                  }
                } else {
                  console.error('Board tasks API request failed:', tasksResponse.status);
                  setTasks([]);
                }
              } catch (tasksError) {
                console.error('Error fetching board tasks:', tasksError);
                setTasks([]);
              }
            } else {
              console.log('No boards found for project, using default columns');
              setColumns([
                { id: 'todo', name: 'To Do', color: '#6B7280', order: 0, taskIds: [] },
                { id: 'in-progress', name: 'In Progress', color: '#3B82F6', order: 1, taskIds: [] },
                { id: 'review', name: 'Review', color: '#F59E0B', order: 2, taskIds: [] },
                { id: 'done', name: 'Done', color: '#10B981', order: 3, taskIds: [] }
              ]);
            }
          } else {
            console.warn('Boards API request failed:', boardsResponse.status);
            const errorText = await boardsResponse.text();
            console.warn('Boards API error response:', errorText);
            // Fallback to default columns
            setColumns([
              { id: 'todo', name: 'To Do', color: '#6B7280', order: 0, taskIds: [] },
              { id: 'in-progress', name: 'In Progress', color: '#3B82F6', order: 1, taskIds: [] },
              { id: 'review', name: 'Review', color: '#F59E0B', order: 2, taskIds: [] },
              { id: 'done', name: 'Done', color: '#10B981', order: 3, taskIds: [] }
            ]);
          }
        } catch (boardError) {
          console.error('Error fetching boards:', boardError);
          console.error('Board fetch error details:', {
            projectId: currentProject.id,
            token: token ? 'Present' : 'Missing',
            apiUrl: `${API_BASE_URL}/api/boards?projectId=${currentProject.id}`
          });
          // Fallback to default columns
          setColumns([
            { id: 'todo', name: 'To Do', color: '#6B7280', order: 0, taskIds: [] },
            { id: 'in-progress', name: 'In Progress', color: '#3B82F6', order: 1, taskIds: [] },
            { id: 'review', name: 'Review', color: '#F59E0B', order: 2, taskIds: [] },
            { id: 'done', name: 'Done', color: '#10B981', order: 3, taskIds: [] }
          ]);
        }

      } catch (error) {
        console.error('Failed to fetch kanban data:', error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentProject, isAuthenticated, token, isConnected, joinBoard]);

  // Set up real-time event listeners
  useEffect(() => {
    if (!currentBoardId) return;

    console.log('Setting up real-time listeners for board:', currentBoardId);

    // Listen for task creation
    const unsubscribeTaskCreated = onTaskCreated((newTask: Task) => {
      console.log('🟢 Real-time: Task created event received', newTask);
      setTasks(prev => [...prev, newTask]);
    });

    // Listen for task updates (includes moves)
    const unsubscribeTaskUpdated = onTaskUpdated((updatedTask: Task) => {
      console.log('🔄 Real-time: Task updated event received', {
        taskId: updatedTask.id,
        taskTitle: (updatedTask as Task & { title?: string }).title,
        columnId: updatedTask.columnId,
        fullTask: updatedTask,
        currentBoardId: currentBoardId,
        taskBoardId: (updatedTask as Task & { boardId?: string }).boardId
      });
      
      // Check if this update is for the current board
      const taskBoardId = (updatedTask as Task & { boardId?: string }).boardId;
      if (taskBoardId && taskBoardId !== currentBoardId) {
        console.log('⏭️ Skipping task update - different board:', {
          currentBoardId,
          taskBoardId,
          boardIdMatch: taskBoardId === currentBoardId
        });
        return;
      }
      
      setTasks(prev => {
        console.log('📋 Before task update - current tasks:', prev.map(t => ({
          id: t.id,
          title: t.title,
          columnId: t.columnId
        })));
        
        const newTasks = prev.map(task => {
          // Handle both _id and id formats
          const isMatch = taskMatches(task, updatedTask.id) || 
                          taskMatches(task, (updatedTask as { _id?: string })._id || '');
          
          if (isMatch) {
            console.log('✅ Updating task in real-time:', {
              taskTitle: task.title,
              oldColumnId: task.columnId,
              newColumnId: updatedTask.columnId,
              taskId: task.id,
              updatedTaskId: updatedTask.id
            });
            return { 
              ...task, 
              ...updatedTask,
              id: task.id // Preserve the original ID format
            };
          }
          return task;
        });
        
        console.log('📊 After task update - new tasks:', newTasks.map(t => ({
          id: t.id,
          title: t.title,
          columnId: t.columnId
        })));
        
        return newTasks;
      });
    });

    // Listen for task deletion
    const unsubscribeTaskDeleted = onTaskDeleted((taskId: string) => {
      console.log('🗑️ Real-time: Task deleted event received', taskId);
      setTasks(prev => prev.filter(task => !taskMatches(task, taskId)));
    });

    // Listen for task movement (alternative approach)
    const unsubscribeTaskMoved = onTaskMoved((data) => {
      console.log('🚀 Real-time: Task moved event received', {
        data,
        dataKeys: Object.keys(data),
        currentBoardId,
        eventBoardId: data.boardId,
        boardIdMatch: data.boardId === currentBoardId
      });
      
      // Check if this move is for the current board
      if (data.boardId !== currentBoardId) {
        console.log('⏭️ Skipping task move - different board:', {
          currentBoardId,
          eventBoardId: data.boardId
        });
        return;
      }
      
      // FIXED: Extract taskId from the task object or use data.taskId as fallback
      interface TaskMoveData {
        taskId?: string;
        task?: { id?: string; _id?: string };
        fromColumnId: string;
        toColumnId: string;
        boardId: string;
      }
      const moveData = data as TaskMoveData;
      const taskId = moveData.task?.id || moveData.task?._id || moveData.taskId;
      
      if (!taskId) {
        console.error('❌ Task moved event has no taskId! Skipping to prevent all tasks moving:', data);
        return;
      }
      
      console.log('✅ Valid task move event - taskId found:', taskId);
      
      setTasks(prev => {
        console.log('📋 Before task move - current tasks:', prev.map(t => ({
          id: t.id,
          title: t.title,
          columnId: t.columnId
        })));
        
        const newTasks = prev.map(task => {
          const isMatch = taskMatches(task, taskId);
          if (isMatch) {
            console.log('✅ Moving task via moveTask event:', {
              taskTitle: task.title,
              fromColumn: data.fromColumnId,
              toColumn: data.toColumnId,
              taskId: task.id,
              eventTaskId: taskId
            });
            return { ...task, columnId: data.toColumnId };
          }
          return task;
        });
        
        console.log('📊 Tasks after move:', newTasks.map(t => ({
          id: t.id,
          title: t.title,
          columnId: t.columnId
        })));
        
        return newTasks;
      });
    });

    // Listen for manual sync events (custom solution)
    let unsubscribeManualSync: (() => void) | null = null;
    
    import('@/lib/socket').then(({ socketService }) => {
      if (socketService.getSocket()) {
        const handleManualSync = (data: {
          boardId: string;
          task: Task;
          action: string;
          fromColumn: string;
          toColumn: string;
        }) => {
          console.log('🔄 Manual sync event received:', data);
          
          if (data.boardId === currentBoardId && data.task && data.action === 'move') {
            setTasks(prev => {
              const newTasks = prev.map(task => {
                const isMatch = taskMatches(task, data.task.id);
                if (isMatch) {
                  console.log('✅ Syncing task manually:', {
                    taskTitle: task.title,
                    fromColumn: data.fromColumn,
                    toColumn: data.toColumn
                  });
                  return { ...task, columnId: data.task.columnId };
                }
                return task;
              });
              
              console.log('📊 Tasks after manual sync:', newTasks.map(t => ({
                id: t.id,
                title: t.title,
                columnId: t.columnId
              })));
              
              return newTasks;
            });
          }
        };
        
        socketService.getSocket()?.on('task:manual-sync', handleManualSync);
        
        unsubscribeManualSync = () => {
          socketService.getSocket()?.off('task:manual-sync', handleManualSync);
        };
      }
    });

    // Cleanup listeners on unmount or board change
    return () => {
      unsubscribeTaskCreated();
      unsubscribeTaskUpdated();
      unsubscribeTaskDeleted();
      unsubscribeTaskMoved();
      unsubscribeManualSync?.();
    };
  }, [currentBoardId, onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskMoved, taskMatches]);

  // Collection management functions
  const handleCreateCollection = async (collectionData: CreateCollectionForm) => {
    if (!currentProject || !token) return;
    
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      if (editingCollection) {
        // Update existing collection
        const response = await fetch(`${API_BASE_URL}/api/collections/${editingCollection.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(collectionData)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Update in collections state
            const updatedCollection: Collection = {
              id: result.data._id,
              name: result.data.name,
              description: result.data.description,
              color: result.data.color,
              projectId: result.data.projectId,
              createdBy: result.data.createdBy,
              order: result.data.order,
              isArchived: result.data.isArchived,
              createdAt: new Date(result.data.createdAt),
              updatedAt: new Date(result.data.updatedAt)
            };
            
            setCollections(prev => prev.map(c => c.id === editingCollection.id ? updatedCollection : c));
            setShowCollectionDialog(false);
            setEditingCollection(undefined);
            
            console.log('✅ Collection updated successfully:', updatedCollection);
          }
        } else {
          console.error('Failed to update collection:', response.status);
        }
      } else {
        // Create new collection
        const response = await fetch(`${API_BASE_URL}/api/collections`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...collectionData,
            projectId: currentProject.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Transform and add to collections state
            const newCollection: Collection = {
              id: result.data._id,
              name: result.data.name,
              description: result.data.description,
              color: result.data.color,
              projectId: result.data.projectId,
              createdBy: result.data.createdBy,
              order: result.data.order,
              isArchived: result.data.isArchived,
              createdAt: new Date(result.data.createdAt),
              updatedAt: new Date(result.data.updatedAt)
            };
            
            setCollections(prev => [...prev, newCollection]);
            setShowCollectionDialog(false);
            setEditingCollection(undefined);
            
            console.log('✅ Collection created successfully:', newCollection);
          }
        } else {
          console.error('Failed to create collection:', response.status);
        }
      }
    } catch (error) {
      console.error('Error saving collection:', error);
    }
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setShowCollectionDialog(true);
  };

  const handleNewCollection = () => {
    setEditingCollection(undefined);
    setShowCollectionDialog(true);
  };

  // Leave board room when component unmounts or project changes
  useEffect(() => {
    return () => {
      leaveBoard();
    };
  }, [leaveBoard]);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setIsDragging(false);

    if (!over) return;

    const taskId = active.id as string;
    const newColumnId = over.id as string;
    
    // Find the task being moved
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // If dropped on the same column, do nothing
    if (task.columnId === newColumnId) return;

    const oldColumnId = task.columnId;

    // Optimistically update the UI (use columnId instead of status)
    setTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, columnId: newColumnId }
          : t
      )
    );

    // Update via API
    const updateTask = async () => {
      try {
        console.log('Moving task:', {
          taskId,
          from: oldColumnId,
          to: newColumnId,
          boardId: currentBoardId
        });

        // Update columnId in the backend
        const updatedTask = await tasksApi.update(taskId, { columnId: newColumnId });
        console.log('Task update API response:', updatedTask);
        
        // Force emit a custom real-time event for immediate sync
        if (currentBoardId) {
          // Get the column tasks for new index calculation
          const columnTasks = tasks.filter(t => t.columnId === newColumnId && t.id !== taskId);
          const newIndex = columnTasks.length;
          
          console.log('Emitting custom moveTask event:', {
            taskId,
            fromColumnId: oldColumnId,
            toColumnId: newColumnId,
            newIndex,
            boardId: currentBoardId
          });
          
          // Emit move event
          moveTask({
            taskId,
            fromColumnId: oldColumnId,
            toColumnId: newColumnId,
            newIndex,
            boardId: currentBoardId
          });
          
          // ALSO emit a manual task update event for other browsers
          // This ensures sync even if backend doesn't emit task:updated
          const fullTask = tasks.find(t => t.id === taskId);
          if (fullTask) {
            const updatedFullTask = { ...fullTask, columnId: newColumnId };
            console.log('Manually emitting task update for sync:', updatedFullTask);
            
            // Use the socket service directly to emit a custom sync event
            import('@/lib/socket').then(({ socketService }) => {
              if (socketService.getSocket()) {
                socketService.getSocket()?.emit('task:manual-sync', {
                  boardId: currentBoardId,
                  task: updatedFullTask,
                  action: 'move',
                  fromColumn: oldColumnId,
                  toColumn: newColumnId
                });
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to move task:', error);
        // Revert optimistic update on error
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === taskId 
              ? { ...t, columnId: oldColumnId }
              : t
          )
        );
      }
    };

    updateTask();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getDaysUntilDue = (dueDate?: Date) => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const daysUntilDue = getDaysUntilDue(task.dueDate);
    const completedSubtasks = task.subtasks.filter(st => st.completed).length;
    
    // Get collection info for this task
    const taskCollection = task.collectionId 
      ? collections.find(c => c.id === task.collectionId)
      : undefined;

    // Debug logging
    if (task.collectionId) {
      console.log(`Task "${task.title}" has collectionId:`, task.collectionId);
      console.log('Available collections:', collections.map(c => ({ id: c.id, name: c.name })));
      console.log('Found collection:', taskCollection?.name || 'NOT FOUND');
    }

    return (
      <Card 
        className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onTaskClick(task)}
      >
        <div className="space-y-3">
          {/* Collection indicator */}
          {taskCollection && (
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: taskCollection.color }}
              />
              <span className="text-xs text-gray-500 font-medium">
                {taskCollection.name}
              </span>
            </div>
          )}
          
          {/* Priority indicator and title */}
          <div className="flex items-start gap-2">
            <div 
              className="w-1 h-4 rounded-full flex-shrink-0 mt-1"
              style={{ backgroundColor: getPriorityColor(task.priority) }}
            />
            <h4 className="font-medium text-gray-800 flex-1">{task.title}</h4>
          </div>

          {/* Labels */}
          {task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.map((label, index) => (
                <Badge
                  key={`${task.id}-label-${label.id || index}`}
                  value={label.name}
                  style={{ backgroundColor: label.color }}
                  className="text-xs"
                />
              ))}
            </div>
          )}

          {/* Description preview */}
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              {/* Subtasks progress */}
              {task.subtasks.length > 0 && (
                <span>{completedSubtasks}/{task.subtasks.length} subtasks</span>
              )}
              
              {/* Time tracked */}
              {task.timeTracked > 0 && (
                <div className="flex items-center gap-1">
                  <i className="pi pi-clock"></i>
                  <span>{Math.floor(task.timeTracked / 60)}h {task.timeTracked % 60}m</span>
                </div>
              )}
              
              {/* Comments count */}
              {task.comments.length > 0 && (
                <div className="flex items-center gap-1">
                  <i className="pi pi-comment"></i>
                  <span>{task.comments.length}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Due date */}
              {daysUntilDue !== null && (
                <span 
                  className={`px-2 py-1 rounded text-xs ${
                    daysUntilDue < 0 
                      ? 'bg-red-100 text-red-700' 
                      : daysUntilDue <= 2 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {daysUntilDue < 0 ? 'Overdue' : `${daysUntilDue}d left`}
                </span>
              )}

              {/* Assignee with avatar */}
              {task.assignee && (
                <div className="flex items-center gap-1">
                  {task.assignee.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={task.assignee.avatar} 
                      alt={task.assignee.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <Avatar
                      label={task.assignee.username[0].toUpperCase()}
                      size="normal"
                      shape="circle"
                      className="bg-blue-500 text-white w-6 h-6 text-xs"
                    />
                  )}
                  <span className="hidden sm:inline">{task.assignee.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const DraggableTask = ({ task }: { task: Task }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: task.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.3 : 1,
      cursor: isDragging ? 'grabbing' : 'grab',
      zIndex: isDragging ? 1000 : 'auto',
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className={`transition-all duration-200 ${isDragging ? 'scale-105 shadow-2xl rotate-2' : 'hover:shadow-md'}`}
      >
        <TaskCard task={task} />
      </div>
    );
  };

  const KanbanColumn = ({ column }: { column: Column }) => {
    // Filter tasks by columnId and collection filter
    const columnTasks = tasks.filter(task => {
      // First filter by column
      if (task.columnId !== column.id) return false;
      
      // Then filter by collection selection
      if (selectedCollectionFilter === null) {
        // Show all tasks when no filter is selected
        return true;
      } else if (selectedCollectionFilter === 'none') {
        // Show only tasks with no collection
        return !task.collectionId;
      } else {
        // Show only tasks with the selected collection
        return task.collectionId === selectedCollectionFilter;
      }
    });

    const { isOver, setNodeRef } = useDroppable({
      id: column.id,
    });

    return (
      <div className={`flex-1 min-w-80 bg-gray-50 rounded-lg p-4 transition-all duration-300 ${
        isDragging ? 'shadow-lg ring-2 ring-gray-200' : ''
      } ${isOver ? 'ring-2 ring-blue-400 shadow-xl' : ''}`}>
        {/* Column header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                isOver ? 'scale-125 shadow-lg' : ''
              }`}
              style={{ backgroundColor: column.color }}
            />
            <h3 className={`font-semibold text-gray-800 transition-all duration-300 ${
              isOver ? 'text-blue-600 scale-105' : ''
            }`}>
              {column.name}
            </h3>
            <Badge value={columnTasks.length} className="bg-gray-200 text-gray-700" />
            {isOver && (
              <i className="pi pi-arrow-down text-blue-500 animate-bounce ml-2"></i>
            )}
          </div>
          
          <Button 
            icon="pi pi-plus" 
            className="p-button-sm p-button-text p-button-rounded"
            onClick={() => onTaskClick()}
          />
        </div>

        {/* Droppable Tasks Area */}
        <div 
          ref={setNodeRef}
          className={`space-y-3 min-h-32 rounded-lg p-3 transition-all duration-300 ${
            isOver 
              ? 'bg-blue-50 border-2 border-blue-400 border-dashed shadow-inner scale-102' 
              : 'bg-transparent border-2 border-transparent'
          }`}
        >
          {isOver && (
            <div className="text-center py-4 text-blue-600 font-medium">
              <i className="pi pi-arrow-down text-xl mb-2 block animate-bounce"></i>
              Drop task here
            </div>
          )}
          
          <SortableContext items={columnTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
            {columnTasks.map(task => (
              <DraggableTask key={task.id} task={task} />
            ))}
          </SortableContext>
          
          {columnTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <i className="pi pi-inbox text-2xl mb-2 block"></i>
              <p>No tasks</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-2xl text-blue-500 mb-2"></i>
          <p className="text-gray-600">Loading kanban board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Real-time Status Bar */}
      <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Collection Filter */}
          {collections.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <Dropdown
                value={selectedCollectionFilter === null ? 'all' : selectedCollectionFilter} // Convert null to 'all' for display
                options={[
                  { label: 'All Tasks', value: 'all' }, // Changed from null to 'all'
                  { label: 'No Collection', value: 'none' },
                  ...collections.map(collection => ({
                    label: collection.name,
                    value: collection.id,
                    color: collection.color
                  }))
                ]}
                onChange={(e) => setSelectedCollectionFilter(e.value === 'all' ? null : e.value)} // Convert 'all' back to null
                placeholder="Filter by collection"
                className="w-48"
                itemTemplate={(option) => (
                  <div className="flex items-center gap-2">
                    {option.color && (
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    {option.value === 'none' && (
                      <i className="pi pi-ban text-gray-400 text-xs"></i>
                    )}
                    {option.value === 'all' && (
                      <i className="pi pi-list text-gray-400 text-xs"></i>
                    )}
                    <span>{option.label}</span>
                  </div>
                )}
                valueTemplate={(option) => {
                  if (!option || option.value === 'all') {
                    return (
                      <div className="flex items-center gap-2">
                        <i className="pi pi-list text-gray-400 text-xs"></i>
                        <span className="text-sm">All Tasks</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2">
                      {option.color && (
                        <div 
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      {option.value === 'none' && (
                        <i className="pi pi-ban text-gray-400 text-xs"></i>
                      )}
                      <span className="text-sm">{option.label}</span>
                    </div>
                  );
                }}
              />
              {/* Clear Filter Button */}
              {selectedCollectionFilter !== null && (
                <Button
                  icon="pi pi-times"
                  className="p-button-text p-button-sm"
                  tooltip="Clear filter"
                  onClick={() => setSelectedCollectionFilter(null)}
                />
              )}
            </div>
          )}
          
          {/* Active Users */}
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Active users:</span>
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 5).map((user) => (
                  <div
                    key={user.userId}
                    className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center"
                    title={user.username}
                  >
                    <span className="text-xs text-white font-medium">
                      {user.username[0].toUpperCase()}
                    </span>
                  </div>
                ))}
                {activeUsers.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-gray-500 border-2 border-white flex items-center justify-center">
                    <span className="text-xs text-white">+{activeUsers.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {/* Filter Status */}
          {selectedCollectionFilter && (
            <div className="flex items-center gap-2">
              {selectedCollectionFilter === 'none' ? (
                <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                  <i className="pi pi-ban text-gray-500 text-xs"></i>
                  <span className="text-xs text-gray-600">Showing: No Collection</span>
                </div>
              ) : (
                (() => {
                  const filterCollection = collections.find(c => c.id === selectedCollectionFilter);
                  return filterCollection ? (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: filterCollection.color + '20' }}>
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: filterCollection.color }}
                      />
                      <span className="text-xs" style={{ color: filterCollection.color }}>Showing: {filterCollection.name}</span>
                    </div>
                  ) : null;
                })()
              )}
              <span className="text-xs text-gray-500">
                ({tasks.filter(t => {
                  if (selectedCollectionFilter === 'none') return !t.collectionId;
                  return t.collectionId === selectedCollectionFilter;
                }).length} tasks)
              </span>
            </div>
          )}
          
          {/* Collections Count */}
          {collections.length > 0 && (
            <span className="text-sm text-gray-600">
              {collections.length} collection{collections.length !== 1 ? 's' : ''}
            </span>
          )}
          
          {/* New Collection Button */}
          <Button
            icon="pi pi-folder-plus"
            label="New Collection"
            size="small"
            outlined
            className="text-sm"
            onClick={handleNewCollection}
          />
          
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {typingUsers.map(u => u.username).join(', ')} typing...
              </span>
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto p-6 min-h-screen pb-20">
          {columns.map(column => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask ? (
            <div className="transform rotate-3 scale-105 shadow-2xl">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* Collection Management Dialog */}
      <CollectionDialog
        visible={showCollectionDialog}
        collection={editingCollection}
        onHide={() => {
          setShowCollectionDialog(false);
          setEditingCollection(undefined);
        }}
        onSave={handleCreateCollection}
      />
    </div>
  );
}