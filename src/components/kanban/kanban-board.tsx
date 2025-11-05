'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { TaskFilter, TaskSort, Task, Project, Board } from '@/types/task';

interface KanbanBoardProps {
  filters: TaskFilter;
  sorting: TaskSort;
  onTaskClick: (task?: Task) => void;
  currentProject?: Project;
  currentBoard?: Board;
}

// Mock data for demonstration
const mockColumns = [
  { id: '1', name: 'To Do', color: '#6B7280', order: 0, taskIds: ['1', '2'] },
  { id: '2', name: 'In Progress', color: '#3B82F6', order: 1, taskIds: ['3'] },
  { id: '3', name: 'Review', color: '#F59E0B', order: 2, taskIds: [] },
  { id: '4', name: 'Done', color: '#10B981', order: 3, taskIds: ['4'] }
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design login flow',
    description: 'Create wireframes and mockups for the login process',
    status: 'todo',
    priority: 'high',
    assignee: { id: '1', username: 'John Doe', email: 'john@example.com', role: 'user' },
    reporter: { id: '1', username: 'John Doe', email: 'john@example.com', role: 'user' },
    projectId: '1',
    boardId: '1',
    columnId: '1',
    labels: [{ id: '1', name: 'Design', color: '#8B5CF6' }],
    dueDate: new Date('2025-11-10'),
    createdAt: new Date(),
    updatedAt: new Date(),
    subtasks: [
      { id: '1', title: 'Research competitors', completed: true, createdAt: new Date() },
      { id: '2', title: 'Create wireframes', completed: false, createdAt: new Date() }
    ],
    comments: [],
    attachments: [],
    timeTracked: 120,
    dependencies: []
  },
  {
    id: '2',
    title: 'Setup database schema',
    description: 'Define MongoDB collections and relationships',
    status: 'todo',
    priority: 'medium',
    reporter: { id: '1', username: 'John Doe', email: 'john@example.com', role: 'user' },
    projectId: '1',
    boardId: '1',
    columnId: '1',
    labels: [{ id: '2', name: 'Backend', color: '#059669' }],
    createdAt: new Date(),
    updatedAt: new Date(),
    subtasks: [],
    comments: [],
    attachments: [],
    timeTracked: 0,
    dependencies: []
  },
  {
    id: '3',
    title: 'Implement authentication',
    description: 'JWT-based auth with Express and MongoDB',
    status: 'in-progress',
    priority: 'high',
    assignee: { id: '2', username: 'Jane Smith', email: 'jane@example.com', role: 'user' },
    reporter: { id: '1', username: 'John Doe', email: 'john@example.com', role: 'user' },
    projectId: '1',
    boardId: '1',
    columnId: '2',
    labels: [{ id: '2', name: 'Backend', color: '#059669' }],
    createdAt: new Date(),
    updatedAt: new Date(),
    subtasks: [
      { id: '1', title: 'Setup JWT middleware', completed: true, createdAt: new Date() },
      { id: '2', title: 'Create user routes', completed: true, createdAt: new Date() },
      { id: '3', title: 'Add password hashing', completed: false, createdAt: new Date() }
    ],
    comments: [
      {
        id: '1',
        content: 'Making good progress on this. JWT setup is complete.',
        author: { id: '2', username: 'Jane Smith', email: 'jane@example.com', role: 'user' },
        taskId: '3',
        createdAt: new Date(),
        mentions: []
      }
    ],
    attachments: [],
    timeTracked: 300,
    dependencies: []
  },
  {
    id: '4',
    title: 'Update documentation',
    description: 'Add API documentation for new endpoints',
    status: 'done',
    priority: 'low',
    assignee: { id: '1', username: 'John Doe', email: 'john@example.com', role: 'user' },
    reporter: { id: '1', username: 'John Doe', email: 'john@example.com', role: 'user' },
    projectId: '1',
    boardId: '1',
    columnId: '4',
    labels: [{ id: '3', name: 'Documentation', color: '#6366F1' }],
    createdAt: new Date(),
    updatedAt: new Date(),
    subtasks: [],
    comments: [],
    attachments: [],
    timeTracked: 60,
    dependencies: []
  }
];

export function KanbanBoard({ filters, sorting, onTaskClick, currentProject, currentBoard }: KanbanBoardProps) {
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

  return (
    <div className="h-full p-6 overflow-x-auto">
      <div className="flex gap-6 h-full min-w-max">
        {mockColumns.map((column) => {
          const columnTasks = mockTasks.filter(task => task.columnId === column.id);
          
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