'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Calendar as PrimeCalendar } from 'primereact/calendar';
import { InputTextarea } from 'primereact/inputtextarea';
import { Avatar } from 'primereact/avatar';
import { Chip } from 'primereact/chip';
import { Task, User } from '@/types/task';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { tasksApi } from '@/lib/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  onTaskClick?: (task: Task) => void;
  currentProject: any;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
  color?: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  assignee?: User;
}

export function CalendarView({ onTaskClick, currentProject }: CalendarViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreateData, setQuickCreateData] = useState({ date: new Date(), title: '', description: '' });
  const [filterBy, setFilterBy] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);

  const toast = useRef<Toast>(null);
  const { isAuthenticated, token } = useAuth();
  const { 
    isConnected, 
    joinBoard,
    onTaskCreated, 
    onTaskUpdated, 
    onTaskDeleted, 
    onTaskMoved 
  } = useSocket();

  // Status options for filtering
  const filterOptions = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Backlog', value: 'backlog' },
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Review', value: 'review' },
    { label: 'Done', value: 'done' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Due Today', value: 'due-today' },
    { label: 'Due This Week', value: 'due-week' }
  ];

  // Priority colors
  const priorityColors = {
    low: '#10B981',    // green
    medium: '#F59E0B', // yellow
    high: '#EF4444'    // red
  };

  // Status colors
  const statusColors = useMemo(() => ({
    'backlog': '#6B7280',     // gray
    'todo': '#3B82F6',        // blue
    'in-progress': '#F59E0B', // yellow
    'review': '#8B5CF6',      // purple
    'done': '#10B981'         // green
  }), []);

  // Fetch tasks when component mounts or project changes
  useEffect(() => {
    const fetchTasks = async () => {
      if (!currentProject || !isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        
        // First get the board for this project
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
            setCurrentBoardId(board._id);
            
            // Join board room for real-time updates
            if (isConnected) {
              joinBoard(board._id);
            }
            
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
                const transformedTasks: Task[] = tasksData.data.map((task: unknown) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const t = task as any; // Type assertion for API response transformation
                  return {
                    id: t._id,
                    title: t.title,
                    description: t.description || '',
                    status: t.status,
                    priority: t.priority,
                    assignee: t.assignee ? {
                      id: t.assignee._id,
                      username: t.assignee.username,
                      email: t.assignee.email,
                      role: 'user' as const,
                      avatar: t.assignee.avatar
                    } : undefined,
                    reporter: {
                      id: t.reporter._id,
                      username: t.reporter.username,
                      email: t.reporter.email,
                      role: 'user' as const,
                      avatar: t.reporter.avatar
                    },
                    projectId: t.projectId._id || t.projectId,
                    boardId: t.boardId._id || t.boardId,
                    columnId: t.columnId,
                    labels: t.labels || [],
                    dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
                    createdAt: new Date(t.createdAt),
                    updatedAt: new Date(t.updatedAt),
                    subtasks: t.subtasks || [],
                    comments: t.comments || [],
                    attachments: t.attachments || [],
                    timeTracked: t.timeTracked || 0,
                    dependencies: t.dependencies || []
                  };
                });
                
                setTasks(transformedTasks);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load tasks'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [currentProject, isAuthenticated, token, isConnected, joinBoard]);

  // Set up real-time event listeners
  useEffect(() => {
    if (!currentBoardId) return;

    const unsubscribeTaskCreated = onTaskCreated((newTask: Task) => {
      setTasks(prev => [...prev, newTask]);
      toast.current?.show({
        severity: 'success',
        summary: 'Task Created',
        detail: `New task "${newTask.title}" was created`
      });
    });

    const unsubscribeTaskUpdated = onTaskUpdated((updatedTask: Task) => {
      setTasks(prev => prev.map(task => 
        task.id === updatedTask.id ? { ...task, ...updatedTask } : task
      ));
    });

    const unsubscribeTaskDeleted = onTaskDeleted((taskId: string) => {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      toast.current?.show({
        severity: 'info',
        summary: 'Task Deleted',
        detail: 'Task was removed'
      });
    });

    const unsubscribeTaskMoved = onTaskMoved((data) => {
      if (data.boardId !== currentBoardId) return;
      
      setTasks(prev => prev.map(task => {
        if (task.id === data.taskId) {
          return { ...task, columnId: data.toColumnId };
        }
        return task;
      }));
    });

    return () => {
      unsubscribeTaskCreated();
      unsubscribeTaskUpdated();
      unsubscribeTaskDeleted();
      unsubscribeTaskMoved();
    };
  }, [currentBoardId, onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskMoved]);

  // Convert tasks to calendar events
  const getCalendarEvents = useCallback((): CalendarEvent[] => {
    let filteredTasks = tasks.filter(task => task.dueDate); // Only show tasks with due dates

    // Apply search filter
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee?.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status/special filters
    if (filterBy !== 'all') {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

      switch (filterBy) {
        case 'overdue':
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && task.dueDate < startOfToday && task.status !== 'done'
          );
          break;
        case 'due-today':
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && task.dueDate >= startOfToday && task.dueDate <= endOfToday
          );
          break;
        case 'due-week':
          filteredTasks = filteredTasks.filter(task => 
            task.dueDate && task.dueDate >= startOfToday && task.dueDate <= endOfWeek
          );
          break;
        default:
          filteredTasks = filteredTasks.filter(task => task.status === filterBy);
      }
    }

    return filteredTasks.map(task => ({
      id: task.id,
      title: task.title,
      start: task.dueDate!,
      end: task.dueDate!,
      resource: task,
      color: statusColors[task.status as keyof typeof statusColors],
      priority: task.priority,
      status: task.status,
      assignee: task.assignee
    }));
  }, [tasks, filterBy, searchQuery, statusColors]);

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  // Handle slot selection (for creating new tasks)
  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setQuickCreateData({
      date: slotInfo.start,
      title: '',
      description: ''
    });
    setShowQuickCreate(true);
  };

  // Create new task from calendar
  const createQuickTask = async () => {
    if (!quickCreateData.title.trim() || !currentProject || !currentBoardId) return;

    try {
      // We need to get a default column ID for the task
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const boardResponse = await fetch(`${API_BASE_URL}/api/boards/${currentBoardId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!boardResponse.ok) {
        throw new Error('Failed to fetch board details');
      }

      const boardData = await boardResponse.json();
      const defaultColumnId = boardData.data.columns?.[0]?._id || boardData.data.columns?.[0]?.id;

      if (!defaultColumnId) {
        throw new Error('No columns available in board');
      }

      const response = await tasksApi.create({
        title: quickCreateData.title,
        description: quickCreateData.description,
        projectId: currentProject.id,
        boardId: currentBoardId,
        columnId: defaultColumnId,
        dueDate: quickCreateData.date.toISOString(),
        priority: 'medium' as const
      });

      // Check if response is successful and extract task data
      if (response && 'success' in response && response.success && response.data) {
        const newTask = response.data as Task;
        setTasks(prev => [...prev, newTask]);
        setShowQuickCreate(false);
        setQuickCreateData({ date: new Date(), title: '', description: '' });
        
        toast.current?.show({
          severity: 'success',
          summary: 'Task Created',
          detail: `Task "${newTask.title}" created successfully`
        });
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to create task'
      });
    }
  };

  // Delete task
  const deleteTask = async (taskId: string, taskTitle: string) => {
    confirmDialog({
      message: `Are you sure you want to delete "${taskTitle}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await tasksApi.delete(taskId);
          setTasks(prev => prev.filter(t => t.id !== taskId));
          setShowEventDialog(false);
          toast.current?.show({
            severity: 'success',
            summary: 'Task Deleted',
            detail: 'Task has been deleted successfully'
          });
        } catch (error) {
          console.error('Failed to delete task:', error);
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete task'
          });
        }
      }
    });
  };

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const isOverdue = event.resource.dueDate && event.resource.dueDate < new Date() && event.status !== 'done';
    
    return (
      <div className={`p-1 text-xs rounded ${isOverdue ? 'bg-red-100 border-red-300' : ''}`}>
        <div className="flex items-center gap-1">
          <div 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: priorityColors[event.priority] }}
          />
          <span className="font-medium truncate">{event.title}</span>
        </div>
        {event.assignee && (
          <div className="mt-1 flex items-center gap-1">
            {event.assignee.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={event.assignee.avatar} 
                alt={event.assignee.username}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                {event.assignee.username[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs truncate">{event.assignee.username}</span>
          </div>
        )}
      </div>
    );
  };

  const events = getCalendarEvents();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-2xl text-blue-500 mb-2"></i>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Calendar View</h2>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                LIVE
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            {/* Filter Dropdown */}
            <Dropdown
              value={filterBy}
              options={filterOptions}
              onChange={(e) => setFilterBy(e.value)}
              optionLabel="label"
              optionValue="value"
              className="w-36"
              placeholder="Filter tasks"
            />

            {/* Search */}
            <div className="flex items-center gap-2">
              <i className="pi pi-search"></i>
              <InputText
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-48"
              />
            </div>

            {/* New Task Button */}
            <Button
              label="New Task"
              icon="pi pi-plus"
              onClick={() => {
                // TODO: Implement create new task functionality
                console.log('Create new task clicked');
              }}
              className="p-button-primary"
            />
          </div>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            label="Month"
            className={`p-button-sm ${currentView === 'month' ? 'p-button-primary' : 'p-button-outlined'}`}
            onClick={() => setCurrentView('month')}
          />
          <Button
            label="Week"
            className={`p-button-sm ${currentView === 'week' ? 'p-button-primary' : 'p-button-outlined'}`}
            onClick={() => setCurrentView('week')}
          />
          <Button
            label="Day"
            className={`p-button-sm ${currentView === 'day' ? 'p-button-primary' : 'p-button-outlined'}`}
            onClick={() => setCurrentView('day')}
          />
          <Button
            label="Agenda"
            className={`p-button-sm ${currentView === 'agenda' ? 'p-button-primary' : 'p-button-outlined'}`}
            onClick={() => setCurrentView('agenda')}
          />

          <div className="ml-4 flex items-center gap-2">
            <Button
              icon="pi pi-chevron-left"
              className="p-button-outlined p-button-sm"
              onClick={() => {
                const newDate = moment(currentDate).subtract(1, currentView === 'day' ? 'day' : currentView === 'week' ? 'week' : 'month').toDate();
                setCurrentDate(newDate);
              }}
            />
            <span className="font-medium min-w-48 text-center">
              {currentView === 'month' 
                ? moment(currentDate).format('MMMM YYYY')
                : currentView === 'week'
                  ? `${moment(currentDate).startOf('week').format('MMM DD')} - ${moment(currentDate).endOf('week').format('MMM DD, YYYY')}`
                  : moment(currentDate).format('MMMM DD, YYYY')
              }
            </span>
            <Button
              icon="pi pi-chevron-right"
              className="p-button-outlined p-button-sm"
              onClick={() => {
                const newDate = moment(currentDate).add(1, currentView === 'day' ? 'day' : currentView === 'week' ? 'week' : 'month').toDate();
                setCurrentDate(newDate);
              }}
            />
            <Button
              label="Today"
              className="p-button-outlined p-button-sm ml-2"
              onClick={() => setCurrentDate(new Date())}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="flex gap-4 mt-4">
          <Chip label={`${events.length} Tasks`} className="bg-blue-100 text-blue-800" />
          <Chip 
            label={`${events.filter(e => e.resource.dueDate && e.resource.dueDate < new Date() && e.status !== 'done').length} Overdue`} 
            className="bg-red-100 text-red-800" 
          />
          <Chip 
            label={`${events.filter(e => moment(e.resource.dueDate).isSame(new Date(), 'day')).length} Due Today`} 
            className="bg-yellow-100 text-yellow-800" 
          />
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm border" style={{ height: 'calc(100vh - 300px)', minHeight: '500px' }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={currentView}
          onView={setCurrentView}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          drilldownView="day"
          components={{
            event: EventComponent
          }}
          eventPropGetter={(event: CalendarEvent) => ({
            style: {
              backgroundColor: event.color,
              borderColor: event.color,
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }
          })}
          dayPropGetter={(date: Date) => {
            const isToday = moment(date).isSame(new Date(), 'day');
            return {
              style: {
                backgroundColor: isToday ? '#f0f9ff' : undefined
              }
            };
          }}
        />
      </div>

      {/* Event Details Dialog */}
      <Dialog
        header="Task Details"
        visible={showEventDialog}
        onHide={() => setShowEventDialog(false)}
        style={{ width: '600px' }}
        className="p-fluid"
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">{selectedEvent.resource.title}</h3>
              <p className="text-gray-600 mb-4">{selectedEvent.resource.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium">Status</label>
                <Badge 
                  value={selectedEvent.status} 
                  severity={
                    selectedEvent.status === 'done' ? 'success' :
                    selectedEvent.status === 'in-progress' ? 'warning' :
                    selectedEvent.status === 'review' ? 'contrast' : 'info'
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <label className="font-medium">Priority</label>
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: priorityColors[selectedEvent.priority] }}
                  />
                  <span className="capitalize">{selectedEvent.priority}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-medium">Due Date</label>
                <p className="mt-1">{moment(selectedEvent.resource.dueDate).format('MMM DD, YYYY')}</p>
              </div>
              <div>
                <label className="font-medium">Assignee</label>
                <div className="flex items-center gap-2 mt-1">
                  {selectedEvent.assignee ? (
                    <>
                      {selectedEvent.assignee.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={selectedEvent.assignee.avatar} 
                          alt={selectedEvent.assignee.username}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <Avatar
                          label={selectedEvent.assignee.username[0].toUpperCase()}
                          size="normal"
                          shape="circle"
                          className="bg-blue-500 text-white w-6 h-6"
                        />
                      )}
                      <span>{selectedEvent.assignee.username}</span>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                label="Edit Task"
                icon="pi pi-pencil"
                onClick={() => {
                  setShowEventDialog(false);
                  onTaskClick?.(selectedEvent.resource);
                }}
                className="p-button-primary"
              />
              <Button
                label="Delete"
                icon="pi pi-trash"
                onClick={() => deleteTask(selectedEvent.id, selectedEvent.title)}
                className="p-button-danger p-button-outlined"
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Quick Create Dialog */}
      <Dialog
        header="Quick Create Task"
        visible={showQuickCreate}
        onHide={() => setShowQuickCreate(false)}
        style={{ width: '500px' }}
        className="p-fluid"
      >
        <div className="space-y-4">
          <div>
            <label className="font-medium mb-2 block">Task Title</label>
            <InputText
              value={quickCreateData.title}
              onChange={(e) => setQuickCreateData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title..."
              autoFocus
            />
          </div>

          <div>
            <label className="font-medium mb-2 block">Description</label>
            <InputTextarea
              value={quickCreateData.description}
              onChange={(e) => setQuickCreateData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description..."
              rows={3}
            />
          </div>

          <div>
            <label className="font-medium mb-2 block">Due Date</label>
            <PrimeCalendar
              value={quickCreateData.date}
              onChange={(e) => setQuickCreateData(prev => ({ ...prev, date: e.value as Date }))}
              showIcon
              dateFormat="mm/dd/yy"
            />
          </div>

          <div className="flex gap-2 mt-6">
            <Button
              label="Create Task"
              icon="pi pi-check"
              onClick={createQuickTask}
              className="p-button-primary"
              disabled={!quickCreateData.title.trim()}
            />
            <Button
              label="Cancel"
              icon="pi pi-times"
              onClick={() => setShowQuickCreate(false)}
              className="p-button-outlined"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}