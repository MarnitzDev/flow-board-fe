'use client';

import React, { useState, useRef } from 'react';
import { Collection, CreateCollectionForm } from '@/types/task';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { ColorPicker } from 'primereact/colorpicker';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

interface CollectionDialogProps {
  visible: boolean;
  collection?: Collection; // undefined for create, defined for edit
  onHide: () => void;
  onSave: (collectionData: CreateCollectionForm) => Promise<void>;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export function CollectionDialog({ 
  visible, 
  collection, 
  onHide, 
  onSave 
}: CollectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCollectionForm>({
    name: collection?.name || '',
    description: collection?.description || '',
    color: collection?.color || DEFAULT_COLORS[0],
    projectId: collection?.projectId || '',
    order: collection?.order || 0
  });
  const toast = useRef<Toast>(null);

  const isEdit = !!collection;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.current?.show({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Collection name is required'
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(formData);
      onHide();
      
      // Reset form for next use
      setFormData({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0],
        projectId: '',
        order: 0
      });
    } catch (error) {
      console.error('Failed to save collection:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Failed to save collection. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onHide();
    // Reset form when closing
    if (collection) {
      setFormData({
        name: collection.name,
        description: collection.description || '',
        color: collection.color,
        projectId: collection.projectId,
        order: collection.order
      });
    } else {
      setFormData({
        name: '',
        description: '',
        color: DEFAULT_COLORS[0],
        projectId: '',
        order: 0
      });
    }
  };

  return (
    <>
      <Toast ref={toast} />
      <Dialog
        visible={visible}
        style={{ width: '32rem' }}
        header={isEdit ? 'Edit Collection' : 'Create Collection'}
        modal
        className="p-fluid"
        onHide={handleClose}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Collection Name */}
          <div className="field">
            <label htmlFor="name" className="block text-900 font-medium mb-2">
              Collection Name *
            </label>
            <InputText
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter collection name"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="field">
            <label htmlFor="description" className="block text-900 font-medium mb-2">
              Description
            </label>
            <InputTextarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description"
              rows={3}
              autoResize
            />
          </div>

          {/* Color Picker */}
          <div className="field">
            <label className="block text-900 font-medium mb-2">
              Color
            </label>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded border-2 border-gray-300"
                style={{ backgroundColor: formData.color }}
              />
              <ColorPicker
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: `#${e.value}` }))}
              />
              
              {/* Preset Colors */}
              <div className="flex gap-1 ml-3">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded border-2 transition-all ${
                      formData.color === color 
                        ? 'border-gray-400 scale-110' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              label="Cancel"
              icon="pi pi-times"
              text
              onClick={handleClose}
              disabled={loading}
            />
            <Button
              type="submit"
              label={isEdit ? 'Update' : 'Create'}
              icon={isEdit ? 'pi pi-check' : 'pi pi-plus'}
              loading={loading}
            />
          </div>
        </form>
      </Dialog>
    </>
  );
}