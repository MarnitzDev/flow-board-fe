'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Task as TaskType, TaskFilter, Project } from '@/types/task';
import { Task, ViewMode, Gantt } from 'gantt-task-react';
import { format, addDays } from 'date-fns';
import { useSocket } from '@/context/socket-context';
import { useAuth } from '@/context/auth-context';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import "gantt-task-react/dist/index.css";

interface GanttViewProps {
  filters: TaskFilter;
  onTaskClick: (task?: TaskType) => void;
  currentProject?: Project;
}

// Constants
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const VIEW_MODE_OPTIONS = [
  { label: 'Day', value: ViewMode.Day },
  { label: 'Week', value: ViewMode.Week },
  { label: 'Month', value: ViewMode.Month },
  { label: 'Year', value: ViewMode.Year }
];

export function GanttView({ filters, onTaskClick, currentProject }: GanttViewProps) {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [columns, setColumns] = useState<Array<{id: string, name: string, color: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Month);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [localSearch, setLocalSearch] = useState('');
  const socketContext = useSocket();
  const { isAuthenticated, token } = useAuth();
  const toast = useRef<Toast>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      if (!currentProject || !isAuthenticated || !token) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // First get the board for this project (same pattern as other views)
      const boardsResponse = await fetch(`${API_BASE_URL}/api/boards?projectId=${currentProject.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (boardsResponse.ok) {
        const boardsData = await boardsResponse.json();
        if (boardsData.success && boardsData.data && boardsData.data.length > 0) {
          const board = boardsData.data[0];
          
          // Store column information for status options
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const boardColumns = board.columns.map((col: any) => ({
            id: col._id,
            name: col.name,
            color: col.color
          }));
          setColumns(boardColumns);
          
          // Now fetch tasks for this board
          const tasksResponse = await fetch(`${API_BASE_URL}/api/tasks/board/${board._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (tasksResponse.ok) {
            const tasksData = await tasksResponse.json();
            if (tasksData && tasksData.success && Array.isArray(tasksData.data)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const transformedTasks: TaskType[] = tasksData.data.map((task: any) => ({
                id: task._id,
                title: task.title,
                description: task.description || '',
                status: task.status,
                priority: task.priority,
                assignee: task.assignee ? {
                  id: task.assignee._id,
                  username: task.assignee.username,
                  email: task.assignee.email,
                  avatar: task.assignee.avatar,
                  role: task.assignee.role || 'user'
                } : undefined,
                reporter: {
                  id: task.reporter._id,
                  username: task.reporter.username,
                  email: task.reporter.email,
                  avatar: task.reporter.avatar,
                  role: task.reporter.role || 'user'
                },
                projectId: task.projectId,
                boardId: task.boardId,
                columnId: task.columnId,
                labels: task.labels || [],
                startDate: task.startDate ? new Date(task.startDate) : undefined,
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
            } else {
              setTasks([]);
            }
          } else {
            console.error('Failed to fetch tasks:', tasksResponse.status);
            setTasks([]);
          }
        } else {
          setTasks([]);
        }
      } else {
        console.error('Failed to fetch boards:', boardsResponse.status);
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Loading Failed',
        detail: 'Failed to load tasks. Please refresh the page.'
      });
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentProject, isAuthenticated, token]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Socket event handlers
  useEffect(() => {
    if (socketContext?.isConnected) {
      const unsubscribeCreated = socketContext.onTaskCreated((task: TaskType) => {
        if (!currentProject || task.projectId === currentProject.id) {
          setTasks(prev => [...prev, task]);
          toast.current?.show({
            severity: 'success',
            summary: 'Task Created',
            detail: `Task "${task.title}" was created`
          });
        }
      });

      const unsubscribeUpdated = socketContext.onTaskUpdated((task: TaskType) => {
        if (!currentProject || task.projectId === currentProject.id) {
          setTasks(prev => prev.map(t => t.id === task.id ? task : t));
          toast.current?.show({
            severity: 'info',
            summary: 'Task Updated',
            detail: `Task "${task.title}" was updated`
          });
        }
      });

      const unsubscribeDeleted = socketContext.onTaskDeleted((taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        toast.current?.show({
          severity: 'warn',
          summary: 'Task Deleted',
          detail: 'A task was deleted'
        });
      });

      return () => {
        unsubscribeCreated();
        unsubscribeUpdated();
        unsubscribeDeleted();
      };
    }
  }, [socketContext, currentProject]);

  // Convert tasks to Gantt format
  const ganttTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Apply external filters
        if (filters.status && filters.status.length > 0 && !filters.status.includes(task.status)) return false;
        if (filters.assignee && filters.assignee.length > 0 && (!task.assignee || !filters.assignee.includes(task.assignee.id))) return false;
        if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(task.priority)) return false;
        
        // Apply local search
        if (localSearch && !task.title.toLowerCase().includes(localSearch.toLowerCase())) return false;
        
        return true;
      })
      .map((task): Task => {
        const start = task.startDate ? new Date(task.startDate) : new Date();
        const end = task.dueDate ? new Date(task.dueDate) : addDays(start, 3);
        
        // Ensure end is after start
        const finalEnd = end > start ? end : addDays(start, 1);

        return {
          start,
          end: finalEnd,
          name: task.title,
          id: task.id,
          progress: task.status === 'done' ? 100 : task.status === 'in-progress' ? 50 : 0,
          type: 'task',
          dependencies: task.dependencies || [],
          styles: {
            backgroundColor: columns.find(col => col.id === task.columnId)?.color || '#6b7280',
            backgroundSelectedColor: columns.find(col => col.id === task.columnId)?.color || '#6b7280',
            progressColor: '#ffffff',
            progressSelectedColor: '#ffffff'
          }
        };
      });
  }, [tasks, filters, localSearch, columns]);

  // Handle task operations
  const handleTaskSelect = (task: Task) => {
    const originalTask = tasks.find(t => t.id === task.id);
    if (originalTask) {
      setSelectedTask(originalTask);
      setIsDialogVisible(true);
    }
  };

  const handleTaskChange = async (task: Task) => {
    try {
      const originalTask = tasks.find(t => t.id === task.id);
      if (!originalTask) return;

      const updatedTask = {
        ...originalTask,
        startDate: task.start,
        dueDate: task.end
      };

      const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: task.start.toISOString(),
          dueDate: task.end.toISOString()
        })
      });

      if (response.ok) {
        // Update local state
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        
        // Update via socket context if available
        if (socketContext?.isConnected) {
          socketContext.updateTask(task.id, updatedTask);
        }
      } else {
        throw new Error(`Failed to update task: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Update Failed',
        detail: 'Failed to update task dates. Please try again.'
      });
    }
  };

  const handleExpanderClick = (task: Task) => {
    // Use the expander click to show task details
    handleTaskSelect(task);
  };

  // Toolbar content
  const leftToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center">
        <Button
          icon="pi pi-plus"
          label="New Task"
          size="small"
          onClick={() => onTaskClick()}
        />
        <div className="p-inputgroup" style={{ width: '300px' }}>
          <span className="p-inputgroup-addon">
            <i className="pi pi-search"></i>
          </span>
          <InputText
            placeholder="Search tasks..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex flex-wrap gap-2 align-items-center">
        <Dropdown
          value={viewMode}
          options={VIEW_MODE_OPTIONS}
          onChange={(e) => setViewMode(e.value)}
          placeholder="View Mode"
          className="w-10rem"
        />
        {localSearch && (
          <Button
            icon="pi pi-times"
            size="small"
            text
            onClick={() => setLocalSearch('')}
            tooltip="Clear search"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-content-center align-items-center h-20rem">
        <i className="pi pi-spin pi-spinner text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="timeline-view h-full">
      <Toast ref={toast} />
      
      <Card className="mb-3">
        <Toolbar
          left={leftToolbarTemplate}
          right={rightToolbarTemplate}
          className="mb-3"
        />
        
        <div className="gantt-container" style={{ height: 'calc(100vh - 300px)', overflow: 'auto' }}>
          {ganttTasks.length > 0 ? (
            <div>
              <Gantt
                tasks={ganttTasks}
                viewMode={viewMode}
                onDateChange={handleTaskChange}
                onExpanderClick={handleExpanderClick}
                listCellWidth="200px"
                columnWidth={viewMode === ViewMode.Month ? 60 : viewMode === ViewMode.Week ? 100 : 40}
                locale="en"
                fontSize="12"
                fontFamily="Arial, sans-serif"
                barBackgroundColor="#f3f4f6"
                barBackgroundSelectedColor="#e5e7eb"
                rowHeight={40}
                headerHeight={50}
              />
              <div className="mt-3 text-sm text-muted-color">
                <p>💡 <strong>Timeline View Features:</strong></p>
                <ul className="ml-4">
                  <li>• Drag task bars horizontally to change start/end dates</li>
                  <li>• Tasks are color-coded by status: Red (Todo), Orange (In Progress), Green (Done)</li>
                  <li>• Progress bars show completion percentage</li>
                  <li>• Click task names to view details</li>
                  <li>• Change view mode (Day/Week/Month/Year) using the dropdown</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex flex-column align-items-center justify-content-center h-20rem text-muted-color">
              <i className="pi pi-calendar text-6xl mb-3"></i>
              <h3>No tasks found</h3>
              <p>Create a new task or adjust your filters to see timeline data.</p>
            </div>
          )}
        </div>
      </Card>

      {/* Task Details Dialog */}
      <Dialog
        visible={isDialogVisible}
        style={{ width: '50vw' }}
        header={selectedTask ? 'Task Details' : 'Create Task'}
        modal
        className="p-fluid"
        onHide={() => setIsDialogVisible(false)}
      >
        {selectedTask && (
          <div className="grid">
            <div className="col-12">
              <h4>{selectedTask.title}</h4>
              <p className="text-muted-color">{selectedTask.description}</p>
            </div>
            <div className="col-6">
              <label htmlFor="status" className="block text-900 font-medium mb-2">Status</label>
              <p className="text-900">
                <span className={`inline-flex align-items-center px-2 py-1 text-xs font-medium rounded-full mr-2`}
                      style={{ 
                        backgroundColor: (columns.find(col => col.id === selectedTask.columnId)?.color || '#6b7280') + '20',
                        color: columns.find(col => col.id === selectedTask.columnId)?.color || '#6b7280'
                      }}>
                  {columns.find(col => col.id === selectedTask.columnId)?.name || selectedTask.status}
                </span>
              </p>
            </div>
            <div className="col-6">
              <label htmlFor="priority" className="block text-900 font-medium mb-2">Priority</label>
              <p className="text-900 capitalize">{selectedTask.priority}</p>
            </div>
            <div className="col-6">
              <label htmlFor="assignee" className="block text-900 font-medium mb-2">Assignee</label>
              <p className="text-900">{selectedTask.assignee?.username || 'Unassigned'}</p>
            </div>
            <div className="col-6">
              <label htmlFor="reporter" className="block text-900 font-medium mb-2">Reporter</label>
              <p className="text-900">{selectedTask.reporter.username}</p>
            </div>
            <div className="col-6">
              <label htmlFor="startDate" className="block text-900 font-medium mb-2">Start Date</label>
              <p className="text-900">
                {selectedTask.startDate ? format(new Date(selectedTask.startDate), 'MMM dd, yyyy') : 'Not set'}
              </p>
            </div>
            <div className="col-6">
              <label htmlFor="dueDate" className="block text-900 font-medium mb-2">Due Date</label>
              <p className="text-900">
                {selectedTask.dueDate ? format(new Date(selectedTask.dueDate), 'MMM dd, yyyy') : 'Not set'}
              </p>
            </div>
            {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
              <div className="col-12">
                <label className="block text-900 font-medium mb-2">Dependencies</label>
                <div className="flex flex-wrap gap-1">
                  {selectedTask.dependencies.map(depId => {
                    const depTask = tasks.find(t => t.id === depId);
                    return depTask ? (
                      <span key={depId} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {depTask.title}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
            <div className="col-12 mt-3">
              <Button
                label="Edit Task"
                icon="pi pi-pencil"
                onClick={() => {
                  onTaskClick(selectedTask);
                  setIsDialogVisible(false);
                }}
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}