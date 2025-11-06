'use client';

import React from 'react';
import { Collection } from '@/types/task';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';

interface CollectionHeaderProps {
  collection: Collection;
  taskCount: number;
  onEdit: (collection: Collection) => void;
  onArchive: (collection: Collection) => void;
  onDelete: (collection: Collection) => void;
  isDragging?: boolean;
}

export function CollectionHeader({ 
  collection, 
  taskCount, 
  onEdit, 
  onArchive, 
  onDelete,
  isDragging = false 
}: CollectionHeaderProps) {
  return (
    <div 
      className={`collection-header p-3 mb-3 rounded-lg border-l-4 transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{ 
        borderLeftColor: collection.color,
        backgroundColor: `${collection.color}08`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600">
            <i className="pi pi-bars text-sm"></i>
          </div>
          
          {/* Collection Info */}
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: collection.color }}
            />
            <h3 className="font-semibold text-gray-800">{collection.name}</h3>
            <Badge 
              value={taskCount} 
              severity="secondary"
              className="ml-2"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            icon="pi pi-pencil"
            text
            size="small"
            className="p-button-rounded p-button-text"
            onClick={() => onEdit(collection)}
            tooltip="Edit Collection"
            tooltipOptions={{ position: 'top' }}
          />
          <Button
            icon={collection.isArchived ? "pi pi-eye" : "pi pi-archive"}
            text
            size="small"
            className="p-button-rounded p-button-text"
            onClick={() => onArchive(collection)}
            tooltip={collection.isArchived ? "Unarchive" : "Archive"}
            tooltipOptions={{ position: 'top' }}
          />
          <Button
            icon="pi pi-trash"
            text
            size="small"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => onDelete(collection)}
            tooltip="Delete Collection"
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      </div>

      {/* Description */}
      {collection.description && (
        <p className="text-sm text-gray-600 mt-2 ml-6">
          {collection.description}
        </p>
      )}
    </div>
  );
}