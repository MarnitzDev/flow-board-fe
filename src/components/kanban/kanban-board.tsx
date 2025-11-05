'use client';

import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { TaskFilter, TaskSort, Task, Project, Board, Column } from '@/types/task';
import { useAuth } from '@/context/auth-context';

interface KanbanBoardProps {
  filters: TaskFilter;
  sorting: TaskSort;
  onTaskClick: (task?: Task) => void;
  currentProject?: Project;
  currentBoard?: Board;
}

export function KanbanBoard({ onTaskClick, currentProject }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();

  // Fetch tasks when project changes
  useEffect(() => {
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
          
          const boardsResponse = await fetch(`${API_BASE_URL}/api/boards?projectId=${currentProject.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Boards response status:', boardsResponse.status);
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
              console.log('Successfully loaded real board columns:', boardColumns.map(c => `${c.name} (${c.taskIds.length} tasks)`));
              
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
                      labels: task.labels || [],
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
  }, [currentProject, isAuthenticated, token]);

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

    return (
      <Card 
        className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onTaskClick(task)}
      >
        <div className="space-y-3">
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
              {task.labels.map((label) => (
                <Badge
                  key={label.id}
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

  const KanbanColumn = ({ column }: { column: Column }) => {
    // Use the taskIds from the column to find the actual tasks
    const columnTasks = tasks.filter(task => 
      column.taskIds.includes(task.id) || 
      task.status === column.id || 
      task.columnId === column.id
    );

    return (
      <div className="flex-1 min-w-80 bg-gray-50 rounded-lg p-4">
        {/* Column header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <h3 className="font-semibold text-gray-800">{column.name}</h3>
            <Badge value={columnTasks.length} className="bg-gray-200 text-gray-700" />
          </div>
          
          <Button 
            icon="pi pi-plus" 
            className="p-button-sm p-button-text p-button-rounded"
            onClick={() => onTaskClick()}
          />
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          {columnTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          
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
    <div className="flex gap-6 overflow-x-auto p-6 h-full">
      {columns.map(column => (
        <KanbanColumn key={column.id} column={column} />
      ))}
    </div>
  );
}