'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Task, User, Collection, Label, Column } from '@/types/task';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Badge } from 'primereact/badge';
import { ColorPicker } from 'primereact/colorpicker';

export interface CreateTaskForm {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string;
  projectId: string;
  boardId: string;
  columnId: string;
  collectionId?: string;
  labels?: Array<{ name: string; color: string }>;
  dueDate?: Date;
}

interface TaskDialogProps {
  visible: boolean;
  task?: Task; // undefined for create, defined for edit
  onHide: () => void;
  onSave: (taskData: CreateTaskForm) => Promise<void>;
  projectId: string;
  boardId: string;
  columnId?: string; // Optional - will be provided when creating from a specific column
  columns: Column[]; // Available columns
  collections: Collection[];
  users: User[]; // Available users for assignment
  existingLabels: Label[]; // Existing labels in the project
}

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low', color: '#10B981' },
  { label: 'Medium', value: 'medium', color: '#F59E0B' },
  { label: 'High', value: 'high', color: '#EF4444' }
];

export function TaskDialog({ 
  visible, 
  task, 
  onHide, 
  onSave,
  projectId,
  boardId,
  columnId,
  columns,
  collections,
  users,
  existingLabels
}: TaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTaskForm>({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    assigneeId: task?.assignee?.id || undefined,
    projectId: projectId,
    boardId: boardId,
    columnId: task?.columnId || columnId || '',
    collectionId: task?.collectionId || undefined,
    labels: task?.labels || [],
    dueDate: task?.dueDate || undefined
  });
  
  // Label creation state
  const [showLabelCreator, setShowLabelCreator] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  
  const toast = useRef<Toast>(null);

  const isEdit = !!task;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (visible) {
      // If no columnId is provided and columns are available, default to the first column
      const defaultColumnId = task?.columnId || columnId || (columns.length > 0 ? columns[0].id : '');
      
      setFormData({
        title: task?.title || '',
        description: task?.description || '',
        priority: task?.priority || 'medium',
        assigneeId: task?.assignee?.id || undefined,
        projectId: projectId,
        boardId: boardId,
        columnId: defaultColumnId,
        collectionId: task?.collectionId || undefined,
        labels: task?.labels || [],
        dueDate: task?.dueDate || undefined
      });
    }
  }, [visible, task, projectId, boardId, columnId, columns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.current?.show({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Task title is required',
        life: 3000
      });
      return;
    }

    if (!formData.columnId) {
      toast.current?.show({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please select a column for the task',
        life: 3000
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onHide();
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: `Task ${isEdit ? 'updated' : 'created'} successfully`,
        life: 3000
      });
    } catch (error) {
      console.error('Error saving task:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: `Failed to ${isEdit ? 'update' : 'create'} task`,
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    
    const newLabel = {
      name: newLabelName.trim(),
      color: newLabelColor
    };
    
    setFormData(prev => ({
      ...prev,
      labels: [...(prev.labels || []), newLabel]
    }));
    
    setNewLabelName('');
    setNewLabelColor('#3B82F6');
    setShowLabelCreator(false);
  };

  const handleRemoveLabel = (labelIndex: number) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels?.filter((_, index) => index !== labelIndex) || []
    }));
  };

  const handleAddExistingLabel = (label: Label) => {
    const exists = formData.labels?.some(l => l.name === label.name);
    if (exists) return;
    
    setFormData(prev => ({
      ...prev,
      labels: [...(prev.labels || []), { name: label.name, color: label.color }]
    }));
  };

  const userOptions = users.map(user => ({
    label: user.username,
    value: user.id,
    avatar: user.avatar
  }));

  const collectionOptions = collections.map(collection => ({
    label: collection.name,
    value: collection.id,
    color: collection.color
  }));

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        header={isEdit ? 'Edit Task' : 'Create New Task'}
        visible={visible}
        onHide={onHide}
        modal
        style={{ width: '600px' }}
        maximizable
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="field">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <InputText
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              className="w-full"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="field">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <InputTextarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description"
              rows={3}
              className="w-full"
            />
          </div>

          {/* Priority and Assignee Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="field">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <Dropdown
                id="priority"
                value={formData.priority}
                options={PRIORITY_OPTIONS}
                onChange={(e) => setFormData({ ...formData, priority: e.value })}
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
                valueTemplate={(option) => (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                    <span>{option.label}</span>
                  </div>
                )}
              />
            </div>

            {/* Assignee */}
            <div className="field">
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-2">
                Assignee
              </label>
              <Dropdown
                id="assignee"
                value={formData.assigneeId}
                options={[{ label: 'Unassigned', value: undefined }, ...userOptions]}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.value })}
                placeholder="Select assignee"
                className="w-full"
                showClear
                itemTemplate={(option) => (
                  <div className="flex items-center gap-2">
                    {option.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={option.avatar} 
                        alt={option.label}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-xs text-white">
                          {option.label ? option.label[0].toUpperCase() : '?'}
                        </span>
                      </div>
                    )}
                    <span>{option.label}</span>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Collection and Column Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Collection */}
            <div className="field">
              <label htmlFor="collection" className="block text-sm font-medium text-gray-700 mb-2">
                Collection
              </label>
              <Dropdown
                id="collection"
                value={formData.collectionId}
                options={[{ label: 'No Collection', value: undefined }, ...collectionOptions]}
                onChange={(e) => setFormData({ ...formData, collectionId: e.value })}
                placeholder="Select collection"
                className="w-full"
                showClear
                itemTemplate={(option) => (
                  <div className="flex items-center gap-2">
                    {option.color && (
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: option.color }}
                      />
                    )}
                    <span>{option.label}</span>
                  </div>
                )}
              />
            </div>

            {/* Column */}
            <div className="field">
              <label htmlFor="column" className="block text-sm font-medium text-gray-700 mb-2">
                Column *
              </label>
              <Dropdown
                id="column"
                value={formData.columnId}
                options={columns.map(column => ({
                  label: column.name,
                  value: column.id,
                  color: column.color
                }))}
                onChange={(e) => setFormData({ ...formData, columnId: e.value })}
                placeholder="Select column"
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
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="field">
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <Calendar
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.value as Date })}
              showIcon
              className="w-full"
              dateFormat="mm/dd/yy"
              placeholder="Select due date"
              showButtonBar
            />
          </div>

          {/* Labels */}
          <div className="field">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Labels
            </label>
            
            {/* Current Labels */}
            {formData.labels && formData.labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.labels.map((label, index) => (
                  <Badge
                    key={index}
                    value={
                      <div className="flex items-center gap-1">
                        <span>{label.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLabel(index)}
                          className="text-white hover:text-red-200 ml-1"
                        >
                          <i className="pi pi-times text-xs"></i>
                        </button>
                      </div>
                    }
                    style={{ backgroundColor: label.color }}
                    className="text-white"
                  />
                ))}
              </div>
            )}

            {/* Existing Labels */}
            {existingLabels.length > 0 && (
              <div className="mb-3">
                <small className="text-gray-600 block mb-2">Add existing labels:</small>
                <div className="flex flex-wrap gap-2">
                  {existingLabels
                    .filter(label => !formData.labels?.some(l => l.name === label.name))
                    .map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => handleAddExistingLabel(label)}
                        className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-1"
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Create New Label */}
            {!showLabelCreator ? (
              <Button
                type="button"
                label="Create New Label"
                icon="pi pi-plus"
                size="small"
                outlined
                onClick={() => setShowLabelCreator(true)}
              />
            ) : (
              <div className="border border-gray-300 rounded p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <InputText
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Label name"
                    className="flex-1"
                    size="small"
                  />
                  <div className="flex items-center gap-1">
                    <ColorPicker
                      value={newLabelColor.replace('#', '')}
                      onChange={(e) => setNewLabelColor(`#${e.value}`)}
                      format="hex"
                    />
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: newLabelColor }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    label="Add"
                    size="small"
                    onClick={handleAddLabel}
                    disabled={!newLabelName.trim()}
                  />
                  <Button
                    type="button"
                    label="Cancel"
                    size="small"
                    outlined
                    onClick={() => {
                      setShowLabelCreator(false);
                      setNewLabelName('');
                      setNewLabelColor('#3B82F6');
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              label="Cancel"
              outlined
              onClick={onHide}
              disabled={loading}
            />
            <Button
              type="submit"
              label={isEdit ? 'Update Task' : 'Create Task'}
              loading={loading}
              icon="pi pi-check"
            />
          </div>
        </form>
      </Dialog>
    </>
  );
}