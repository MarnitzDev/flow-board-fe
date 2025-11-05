'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Task } from '@/types/task';

interface RightPanelProps {
  isOpen: boolean;
  task?: Task;
  onClose: () => void;
  onTaskUpdate: (task: Task) => void;
}

export function RightPanel({ isOpen, task, onClose, onTaskUpdate }: RightPanelProps) {
  const priorityOptions = [
    { label: 'Low', value: 'low', color: '#10B981' },
    { label: 'Medium', value: 'medium', color: '#F59E0B' },
    { label: 'High', value: 'high', color: '#EF4444' }
  ];

  const statusOptions = [
    { label: 'To Do', value: 'todo' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Done', value: 'done' }
  ];

  const dialogHeader = task ? 'Task Details' : 'Create New Task';

  const dialogFooter = task ? (
    <div className="flex justify-content-between">
      <Button 
        label="Delete" 
        icon="pi pi-trash" 
        severity="danger" 
        text 
      />
      <div className="flex gap-2">
        <Button 
          label="Cancel" 
          severity="secondary" 
          text 
          onClick={onClose} 
        />
        <Button 
          label="Save Changes" 
          icon="pi pi-check" 
          severity="info"
        />
      </div>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button 
        label="Cancel" 
        severity="secondary" 
        text 
        onClick={onClose} 
      />
      <Button 
        label="Create Task" 
        icon="pi pi-plus" 
        severity="info"
      />
    </div>
  );

  return (
    <Dialog
      header={dialogHeader}
      visible={isOpen}
      onHide={onClose}
      footer={dialogFooter}
      style={{ width: '50vw' }}
      breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      modal
      draggable={false}
      resizable={false}
      className="task-dialog"
    >
      <div className="space-y-6">
        {task ? (
          // Edit existing task
          <>
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <InputText
                value={task.title}
                className="w-full"
                placeholder="Task title..."
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <InputTextarea
                value={task.description || ''}
                rows={4}
                className="w-full"
                placeholder="Add description..."
              />
            </div>

            {/* Properties */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <Dropdown
                  value={task.status}
                  options={statusOptions}
                  optionLabel="label"
                  optionValue="value"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <Dropdown
                  value={task.priority}
                  options={priorityOptions}
                  optionLabel="label"
                  optionValue="value"
                  className="w-full"
                  itemTemplate={(option) => (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                      {option.label}
                    </div>
                  )}
                />
              </div>
            </div>

            {/* Assignee and Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                <div className="flex items-center gap-2 p-2 border rounded">
                  {task.assignee ? (
                    <>
                      <Avatar
                        label={task.assignee.username.charAt(0).toUpperCase()}
                        size="normal"
                        shape="circle"
                      />
                      <span className="text-sm">{task.assignee.username}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">Unassigned</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <Calendar
                  value={task.dueDate}
                  className="w-full"
                  showIcon
                  placeholder="Select date"
                />
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
              <div className="flex flex-wrap gap-2">
                {task.labels.map((label) => (
                  <Badge
                    key={label.id}
                    value={label.name}
                    style={{ backgroundColor: label.color }}
                  />
                ))}
                <Button
                  icon="pi pi-plus"
                  size="small"
                  severity="secondary"
                  text
                  tooltip="Add label"
                />
              </div>
            </div>

            <Divider />

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Subtasks ({task.subtasks.filter(st => st.completed).length}/{task.subtasks.length})
                </label>
                <Button
                  icon="pi pi-plus"
                  size="small"
                  severity="secondary"
                  text
                  tooltip="Add subtask"
                />
              </div>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={subtask.completed}
                      className="rounded"
                    />
                    <span className={`flex-1 text-sm ${
                      subtask.completed ? 'line-through text-gray-500' : ''
                    }`}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* Comments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  Comments ({task.comments.length})
                </label>
              </div>
              <div className="space-y-3">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar
                      label={comment.author.username.charAt(0).toUpperCase()}
                      size="normal"
                      shape="circle"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{comment.author.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add comment */}
              <div className="mt-3 flex gap-2">
                <InputText
                  placeholder="Add a comment..."
                  className="flex-1"
                />
                <Button
                  icon="pi pi-send"
                  size="small"
                />
              </div>
            </div>
          </>
        ) : (
          // Create new task form
          <div className="space-y-4">
            <InputText placeholder="Task title..." className="w-full" />
            <InputTextarea placeholder="Description..." rows={3} className="w-full" />
            
            <div className="grid grid-cols-2 gap-4">
              <Dropdown
                placeholder="Priority"
                options={priorityOptions}
                optionLabel="label"
                optionValue="value"
                className="w-full"
              />
              <Calendar placeholder="Due date" className="w-full" showIcon />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}