'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DataTable, DataTableExpandedRows } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { InputText } from 'primereact/inputtext';
import { Avatar } from 'primereact/avatar';
import { Chip } from 'primereact/chip';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { TaskFilter, TaskSort, Task, Project } from '@/types/task';
import { useAuth } from '@/context/auth-context';
import { useSocket } from '@/context/socket-context';
import { tasksApi } from '@/lib/api';

interface ListViewProps {
  filters: TaskFilter;
  sorting: TaskSort;
  onTaskClick: (task?: Task) => void;
  currentProject?: Project;
}

interface GroupedTasks {
  [key: string]: Task[];
}

export function ListView({ onTaskClick, currentProject }: ListViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [groupBy, setGroupBy] = useState<string>('none');
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
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

  // Status options for dropdown
  const statusOptions = [
    { label: 'Backlog', value: 'backlog', severity: 'secondary' as const },
    { label: 'To Do', value: 'todo', severity: 'info' as const },
    { label: 'In Progress', value: 'in-progress', severity: 'warning' as const },
    { label: 'Review', value: 'review', severity: 'contrast' as const },
    { label: 'Done', value: 'done', severity: 'success' as const }
  ];

  // Priority options
  const priorityOptions = [
    { label: 'Low', value: 'low', color: '#10B981' },
    { label: 'Medium', value: 'medium', color: '#F59E0B' },
    { label: 'High', value: 'high', color: '#EF4444' }
  ];

  // Group by options
  const groupOptions = [
    { label: 'None', value: 'none' },
    { label: 'Status', value: 'status' },
    { label: 'Priority', value: 'priority' },
    { label: 'Assignee', value: 'assignee' },
    { label: 'Due Date', value: 'dueDate' }
  ];

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

  // Update task status
  const updateTaskStatus = async (task: Task, newStatus: string) => {
    try {
      await tasksApi.update(task.id, { status: newStatus });
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: newStatus as Task['status'] } : t
      ));
      toast.current?.show({
        severity: 'success',
        summary: 'Status Updated',
        detail: `Task status changed to ${newStatus}`
      });
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update task status'
      });
    }
  };

  // Update task priority
  const updateTaskPriority = async (task: Task, newPriority: string) => {
    try {
      await tasksApi.update(task.id, { priority: newPriority });
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, priority: newPriority as Task['priority'] } : t
      ));
      toast.current?.show({
        severity: 'success',
        summary: 'Priority Updated',
        detail: `Task priority changed to ${newPriority}`
      });
    } catch (error) {
      console.error('Failed to update task priority:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update task priority'
      });
    }
  };

  // Update task due date
  const updateTaskDueDate = async (task: Task, newDueDate: Date | null) => {
    try {
      await tasksApi.update(task.id, { dueDate: newDueDate });
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, dueDate: newDueDate || undefined } : t
      ));
      toast.current?.show({
        severity: 'success',
        summary: 'Due Date Updated',
        detail: 'Task due date has been updated'
      });
    } catch (error) {
      console.error('Failed to update task due date:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update task due date'
      });
    }
  };

  // Delete task
  const deleteTask = (task: Task) => {
    confirmDialog({
      message: `Are you sure you want to delete "${task.title}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-trash',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        try {
          await tasksApi.delete(task.id);
          setTasks(prev => prev.filter(t => t.id !== task.id));
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

  // Column renderers
  const titleTemplate = (rowData: Task) => (
    <div className="flex items-center gap-2">
      <Button
        icon={expandedRows[rowData.id] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'}
        className="p-button-text p-button-sm"
        onClick={(e) => {
          e.stopPropagation();
          setExpandedRows(prev => ({
            ...prev,
            [rowData.id]: !prev[rowData.id]
          }));
        }}
      />
      <span 
        className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
        onClick={() => onTaskClick(rowData)}
      >
        {rowData.title}
      </span>
    </div>
  );

  const statusTemplate = (rowData: Task) => {
    const status = statusOptions.find(s => s.value === rowData.status);
    return (
      <Dropdown
        value={rowData.status}
        options={statusOptions}
        onChange={(e) => updateTaskStatus(rowData, e.value)}
        optionLabel="label"
        optionValue="value"
        className="w-full"
        itemTemplate={(option) => (
          <Badge 
            value={option.label} 
            severity={option.severity}
            className="w-full"
          />
        )}
        valueTemplate={() => (
          <Badge 
            value={status?.label || 'Unknown'} 
            severity={status?.severity}
          />
        )}
      />
    );
  };

  const priorityTemplate = (rowData: Task) => {
    const priority = priorityOptions.find(p => p.value === rowData.priority);
    return (
      <Dropdown
        value={rowData.priority}
        options={priorityOptions}
        onChange={(e) => updateTaskPriority(rowData, e.value)}
        optionLabel="label"
        optionValue="value"
        className="w-full"
        itemTemplate={(option) => (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: option.color }}
            />
            <span>{option.label}</span>
          </div>
        )}
        valueTemplate={() => (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: priority?.color || '#6B7280' }}
            />
            <span>{priority?.label || 'Unknown'}</span>
          </div>
        )}
      />
    );
  };

  const assigneeTemplate = (rowData: Task) => (
    <div className="flex items-center gap-2">
      {rowData.assignee ? (
        <>
          {rowData.assignee.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={rowData.assignee.avatar} 
              alt={rowData.assignee.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <Avatar
              label={rowData.assignee.username[0].toUpperCase()}
              size="normal"
              shape="circle"
              className="bg-blue-500 text-white"
            />
          )}
          <span>{rowData.assignee.username}</span>
        </>
      ) : (
        <span className="text-gray-400 italic">Unassigned</span>
      )}
    </div>
  );

  const dueDateTemplate = (rowData: Task) => {
    const getDaysUntilDue = (dueDate?: Date) => {
      if (!dueDate) return null;
      const today = new Date();
      const due = new Date(dueDate);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    const daysUntilDue = getDaysUntilDue(rowData.dueDate);
    
    return (
      <div className="flex items-center gap-2">
        <Calendar
          value={rowData.dueDate}
          onChange={(e) => updateTaskDueDate(rowData, e.value as Date)}
          showIcon
          className="w-full"
          placeholder="Set due date"
          dateFormat="mm/dd/yy"
        />
        {daysUntilDue !== null && (
          <Chip 
            label={daysUntilDue < 0 ? 'Overdue' : `${daysUntilDue}d left`}
            className={`text-xs ${
              daysUntilDue < 0 
                ? 'bg-red-100 text-red-700' 
                : daysUntilDue <= 2 
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
            }`}
          />
        )}
      </div>
    );
  };

  const labelsTemplate = (rowData: Task) => (
    <div className="flex flex-wrap gap-1">
      {rowData.labels.map((label, index) => (
        <Chip
          key={label.id || `${rowData.id}-label-${index}`}
          label={label.name}
          style={{ backgroundColor: label.color, color: 'white' }}
          className="text-xs"
        />
      ))}
    </div>
  );

  const actionsTemplate = (rowData: Task) => (
    <div className="flex items-center gap-1">
      <Button
        icon="pi pi-eye"
        className="p-button-text p-button-sm"
        onClick={() => onTaskClick(rowData)}
        tooltip="View Details"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-sm text-red-500"
        onClick={() => deleteTask(rowData)}
        tooltip="Delete Task"
      />
    </div>
  );

  // Row expansion template
  const rowExpansionTemplate = (data: Task) => (
    <div className="p-4 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Description</h4>
          <p className="text-gray-700 mb-4">
            {data.description || 'No description provided'}
          </p>
          
          <h4 className="font-semibold mb-2">Reporter</h4>
          <div className="flex items-center gap-2">
            {data.reporter.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={data.reporter.avatar} 
                alt={data.reporter.username}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <Avatar
                label={data.reporter.username[0].toUpperCase()}
                size="normal"
                shape="circle"
                className="bg-gray-500 text-white"
              />
            )}
            <span>{data.reporter.username}</span>
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Task Details</h4>
          <div className="space-y-2 text-sm">
            <div><strong>Created:</strong> {data.createdAt.toLocaleDateString()}</div>
            <div><strong>Updated:</strong> {data.updatedAt.toLocaleDateString()}</div>
            <div><strong>Time Tracked:</strong> {Math.floor(data.timeTracked / 60)}h {data.timeTracked % 60}m</div>
            <div><strong>Subtasks:</strong> {data.subtasks.length}</div>
            <div><strong>Comments:</strong> {data.comments.length}</div>
            <div><strong>Attachments:</strong> {data.attachments.length}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // Group tasks by selected criteria
  const getGroupedTasks = () => {
    if (groupBy === 'none') return { 'All Tasks': tasks };

    const grouped: GroupedTasks = {};
    
    tasks.forEach(task => {
      let groupKey = '';
      
      switch (groupBy) {
        case 'status':
          groupKey = statusOptions.find(s => s.value === task.status)?.label || 'Unknown';
          break;
        case 'priority':
          groupKey = priorityOptions.find(p => p.value === task.priority)?.label || 'Unknown';
          break;
        case 'assignee':
          groupKey = task.assignee?.username || 'Unassigned';
          break;
        case 'dueDate':
          if (!task.dueDate) {
            groupKey = 'No Due Date';
          } else {
            const days = Math.ceil((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (days < 0) groupKey = 'Overdue';
            else if (days === 0) groupKey = 'Due Today';
            else if (days <= 7) groupKey = 'Due This Week';
            else groupKey = 'Due Later';
          }
          break;
        default:
          groupKey = 'All Tasks';
      }
      
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(task);
    });
    
    return grouped;
  };

  const groupedTasks = getGroupedTasks();

  const header = (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Task List</h2>
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
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Group by:</label>
          <Dropdown
            value={groupBy}
            options={groupOptions}
            onChange={(e) => setGroupBy(e.value)}
            optionLabel="label"
            optionValue="value"
            className="w-32"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <i className="pi pi-search"></i>
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search tasks..."
            className="w-64"
          />
        </div>
        
        <Button
          label="New Task"
          icon="pi pi-plus"
          onClick={() => onTaskClick()}
          className="p-button-primary"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <i className="pi pi-spin pi-spinner text-2xl text-blue-500 mb-2"></i>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      <div className="bg-white rounded-lg shadow">
        {groupBy === 'none' ? (
          <DataTable
            value={tasks}
            header={header}
            globalFilter={globalFilter}
            selectionMode="multiple"
            selection={selectedTasks}
            onSelectionChange={(e) => setSelectedTasks(Array.isArray(e.value) ? e.value : [e.value])}
            expandedRows={expandedRows}
            onRowToggle={(e) => setExpandedRows(e.data as DataTableExpandedRows)}
            rowExpansionTemplate={rowExpansionTemplate}
            dataKey="id"
            paginator
            rows={25}
            rowsPerPageOptions={[10, 25, 50]}
            className="p-datatable-sm"
            responsiveLayout="scroll"
            sortMode="multiple"
            removableSort
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            <Column 
              field="title" 
              header="Task" 
              body={titleTemplate}
              sortable
              filter
              filterPlaceholder="Search by title"
              style={{ minWidth: '200px' }}
            />
            <Column 
              field="status" 
              header="Status" 
              body={statusTemplate}
              sortable
              filter
              filterElement={
                <Dropdown
                  options={statusOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="All Statuses"
                  className="p-column-filter"
                />
              }
              style={{ minWidth: '150px' }}
            />
            <Column 
              field="priority" 
              header="Priority" 
              body={priorityTemplate}
              sortable
              filter
              filterElement={
                <Dropdown
                  options={priorityOptions}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="All Priorities"
                  className="p-column-filter"
                />
              }
              style={{ minWidth: '130px' }}
            />
            <Column 
              field="assignee.username" 
              header="Assignee" 
              body={assigneeTemplate}
              sortable
              filter
              filterPlaceholder="Search by assignee"
              style={{ minWidth: '150px' }}
            />
            <Column 
              field="dueDate" 
              header="Due Date" 
              body={dueDateTemplate}
              sortable
              dataType="date"
              style={{ minWidth: '200px' }}
            />
            <Column 
              field="labels" 
              header="Labels" 
              body={labelsTemplate}
              style={{ minWidth: '150px' }}
            />
            <Column 
              header="Actions" 
              body={actionsTemplate}
              exportable={false}
              style={{ minWidth: '100px' }}
            />
          </DataTable>
        ) : (
          <div>
            <div className="p-4 border-b">
              {header}
            </div>
            {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
              <div key={groupName} className="border-b last:border-b-0">
                <div className="bg-gray-100 px-4 py-2 font-semibold">
                  {groupName} ({groupTasks.length})
                </div>
                <DataTable
                  value={groupTasks}
                  globalFilter={globalFilter}
                  expandedRows={expandedRows}
                  onRowToggle={(e) => setExpandedRows(e.data as DataTableExpandedRows)}
                  rowExpansionTemplate={rowExpansionTemplate}
                  dataKey="id"
                  className="p-datatable-sm"
                  responsiveLayout="scroll"
                >
                  <Column 
                    field="title" 
                    header="Task" 
                    body={titleTemplate}
                    style={{ minWidth: '200px' }}
                  />
                  <Column 
                    field="status" 
                    header="Status" 
                    body={statusTemplate}
                    style={{ minWidth: '150px' }}
                  />
                  <Column 
                    field="priority" 
                    header="Priority" 
                    body={priorityTemplate}
                    style={{ minWidth: '130px' }}
                  />
                  <Column 
                    field="assignee.username" 
                    header="Assignee" 
                    body={assigneeTemplate}
                    style={{ minWidth: '150px' }}
                  />
                  <Column 
                    field="dueDate" 
                    header="Due Date" 
                    body={dueDateTemplate}
                    style={{ minWidth: '200px' }}
                  />
                  <Column 
                    header="Actions" 
                    body={actionsTemplate}
                    style={{ minWidth: '100px' }}
                  />
                </DataTable>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}