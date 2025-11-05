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

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  order: number;
  taskIds: string[];
}

export function KanbanBoard({ filters, sorting, onTaskClick, currentProject, currentBoard }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, token } = useAuth();

  // Fetch tasks and boards when project changes
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
        
        // Make direct API calls instead of using the problematic imports
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // Use default columns since boards endpoint doesn't exist in backend
        console.log('Using default columns - boards API not available');
        setColumns([
          { id: 'todo', name: 'To Do', color: '#6B7280', order: 0, taskIds: [] },
          { id: 'in-progress', name: 'In Progress', color: '#3B82F6', order: 1, taskIds: [] },
          { id: 'review', name: 'Review', color: '#F59E0B', order: 2, taskIds: [] },
          { id: 'done', name: 'Done', color: '#10B981', order: 3, taskIds: [] }
        ]);
          { id: 'review', name: 'Review', color: '#F59E0B', order: 2, taskIds: [] },
          { id: 'done', name: 'Done', color: '#10B981', order: 3, taskIds: [] }
        ]);

        // Try to fetch tasks from available endpoint
        let tasksData = null;
        
        try {
          const tasksResponse = await fetch(`${API_BASE_URL}/api/tasks`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (tasksResponse.ok) {
            tasksData = await tasksResponse.json();
            console.log('Tasks response:', tasksData);
            
            // Check if we got actual task data or just a message
            if (tasksData && Array.isArray(tasksData.data)) {
              // Filter tasks for current project if we got real data
              const projectTasks = tasksData.data.filter((task: any) => task.projectId === currentProject.id);
              
              // Transform API response to match frontend types
              const transformedTasks: Task[] = projectTasks.map((task: any) => ({
                id: task._id,
                title: task.title,
                description: task.description,
                status: task.status || 'todo',
                priority: task.priority || 'medium',
                assignee: task.assignee ? {
                  id: task.assignee._id,
                  username: task.assignee.username,
                  email: task.assignee.email,
                  role: 'user' as const
                } : undefined,
                reporter: task.reporter ? {
                  id: task.reporter._id,
                  username: task.reporter.username,
                  email: task.reporter.email,
                  role: 'user' as const
                } : {
                  id: 'unknown',
                  username: 'Unknown',
                  email: 'unknown@example.com',
                  role: 'user' as const
                },
                projectId: task.projectId,
                boardId: task.boardId || 'default',
                columnId: task.columnId || task.status || 'todo',
                labels: task.labels ? task.labels.map((label: any) => ({
                  id: label._id || label.id,
                  name: label.name,
                  color: label.color
                })) : [],
                dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                createdAt: new Date(task.createdAt || Date.now()),
                updatedAt: new Date(task.updatedAt || Date.now()),
                subtasks: task.subtasks ? task.subtasks.map((subtask: any) => ({
                  id: subtask._id || subtask.id,
                  title: subtask.title,
                  completed: subtask.completed || false,
                  createdAt: new Date(subtask.createdAt || Date.now())
                })) : [],
                comments: [], // Will be loaded separately when task is opened
                attachments: [], // Will be loaded separately when task is opened
                timeTracked: task.timeTracked || 0,
                dependencies: task.dependencies || []
              }));
              
              setTasks(transformedTasks);
              console.log(`Loaded ${transformedTasks.length} tasks for project:`, currentProject.id);
            } else if (tasksData && tasksData.message) {
              // Backend returned a message, create some demo tasks for testing
              console.log('Backend returned message, creating demo tasks:', tasksData.message);
              const demoTasks: Task[] = [
                {
                  id: 'demo-1',
                  title: 'Setup Project Structure',
                  description: 'Initialize the project with proper folder structure and dependencies',
                  status: 'done',
                  priority: 'high',
                  projectId: currentProject.id,
                  boardId: 'default',
                  columnId: 'done',
                  labels: [{ id: 'setup', name: 'Setup', color: '#3B82F6' }],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  subtasks: [],
                  comments: [],
                  attachments: [],
                  timeTracked: 0,
                  dependencies: [],
                  reporter: {
                    id: 'admin',
                    username: 'admin',
                    email: 'admin@flowboard.com',
                    role: 'user' as const
                  }
                },
                {
                  id: 'demo-2',
                  title: 'Implement Authentication',
                  description: 'Add user login and registration functionality',
                  status: 'in-progress',
                  priority: 'high',
                  projectId: currentProject.id,
                  boardId: 'default',
                  columnId: 'inprogress',
                  labels: [{ id: 'auth', name: 'Authentication', color: '#EF4444' }],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  subtasks: [],
                  comments: [],
                  attachments: [],
                  timeTracked: 0,
                  dependencies: [],
                  reporter: {
                    id: 'admin',
                    username: 'admin',
                    email: 'admin@flowboard.com',
                    role: 'user' as const
                  }
                },
                {
                  id: 'demo-3',
                  title: 'Design Kanban Board UI',
                  description: 'Create the user interface for the kanban board with drag and drop',
                  status: 'todo',
                  priority: 'medium',
                  projectId: currentProject.id,
                  boardId: 'default',
                  columnId: 'review',
                  labels: [{ id: 'ui', name: 'UI/UX', color: '#F59E0B' }],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  subtasks: [],
                  comments: [],
                  attachments: [],
                  timeTracked: 0,
                  dependencies: [],
                  reporter: {
                    id: 'admin',
                    username: 'admin',
                    email: 'admin@flowboard.com',
                    role: 'user' as const
                  }
                },
                {
                  id: 'demo-4',
                  title: 'Backend API Integration',
                  description: 'Connect frontend to backend API endpoints',
                  status: 'todo',
                  priority: 'high',
                  projectId: currentProject.id,
                  boardId: 'default',
                  columnId: 'todo',
                  labels: [{ id: 'api', name: 'API', color: '#10B981' }],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  subtasks: [],
                  comments: [],
                  attachments: [],
                  timeTracked: 0,
                  dependencies: [],
                  reporter: {
                    id: 'admin',
                    username: 'admin',
                    email: 'admin@flowboard.com',
                    role: 'user' as const
                  }
                }
              ];
              
              setTasks(demoTasks);
              console.log('Created demo tasks for testing');
            } else {
              console.log('No valid task data received');
              setTasks([]);
            }
          } else {
            console.log('Tasks API not available, using empty task list');
            setTasks([]);
          }
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
          setTasks([]);
        }
      } catch (error) {
        console.error('Failed to fetch kanban data:', error);
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

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          )}

          {/* Subtasks progress */}
          {task.subtasks.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <i className="pi pi-list"></i>
              <span>{completedSubtasks}/{task.subtasks.length} subtasks</span>
              <div className="flex-1 bg-gray-200 rounded-full h-1">
                <div 
                  className="bg-blue-500 h-1 rounded-full"
                  style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Comments */}
              {task.comments.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <i className="pi pi-comment"></i>
                  <span>{task.comments.length}</span>
                </div>
              )}

              {/* Attachments */}
              {task.attachments.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <i className="pi pi-paperclip"></i>
                  <span>{task.attachments.length}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Due date */}
              {task.dueDate && (
                <div className={`text-xs px-2 py-1 rounded ${
                  daysUntilDue !== null && daysUntilDue < 0 
                    ? 'bg-red-100 text-red-700' 
                    : daysUntilDue !== null && daysUntilDue <= 2
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {task.dueDate.toLocaleDateString()}
                </div>
              )}

              {/* Assignee */}
              {task.assignee && (
                <Avatar
                  label={task.assignee.username.charAt(0).toUpperCase()}
                  size="normal"
                  shape="circle"
                  className="w-6 h-6 text-xs"
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full p-6 flex items-center justify-center">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-4xl text-gray-400 mb-4"></i>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6 overflow-x-auto">
      <div className="flex gap-6 h-full min-w-max">
        {columns.map((column) => {
          const columnTasks = tasks.filter(task => task.columnId === column.id);
          
          return (
            <div key={column.id} className="w-80 flex flex-col">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold text-gray-800">{column.name}</h3>
                  <Badge value={columnTasks.length} severity="secondary" />
                </div>
                <Button
                  icon="pi pi-plus"
                  size="small"
                  severity="secondary"
                  text
                  onClick={() => onTaskClick()}
                />
              </div>

              {/* Column Content */}
              <div className="flex-1 bg-gray-50 rounded-lg p-3 overflow-y-auto">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="pi pi-inbox text-2xl mb-2 block"></i>
                    <p className="text-sm">No tasks in {column.name}</p>
                    <Button
                      label="Add Task"
                      size="small"
                      severity="secondary"
                      text
                      className="mt-2"
                      onClick={() => onTaskClick()}
                    />
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}