'use client';

import React from 'react';
import { Collection, Task } from '@/types/task';
import { CollectionHeader } from './collection-header';
import { Card } from 'primereact/card';

interface CollectionCardProps {
  collection: Collection;
  tasks: Task[];
  onEditCollection: (collection: Collection) => void;
  onArchiveCollection: (collection: Collection) => void;
  onDeleteCollection: (collection: Collection) => void;
  onTaskClick?: (task: Task) => void;
  children?: React.ReactNode;
  isDragging?: boolean;
}

export function CollectionCard({
  collection,
  tasks,
  onEditCollection,
  onArchiveCollection,
  onDeleteCollection,
  onTaskClick,
  children,
  isDragging = false
}: CollectionCardProps) {
  // Filter out subtasks for the main view
  const mainTasks = tasks.filter(task => !task.isSubtask);

  return (
    <Card 
      className={`collection-card mb-4 transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      } ${collection.isArchived ? 'opacity-60' : ''}`}
    >
      <CollectionHeader
        collection={collection}
        taskCount={mainTasks.length}
        onEdit={onEditCollection}
        onArchive={onArchiveCollection}
        onDelete={onDeleteCollection}
        isDragging={isDragging}
      />
      
      {/* Task Content Area */}
      <div className="collection-tasks px-3 pb-3">
        {children}
        
        {/* Empty State */}
        {mainTasks.length === 0 && !children && (
          <div className="text-center py-8 text-gray-500">
            <i className="pi pi-inbox text-3xl mb-2 block"></i>
            <p className="text-sm">No tasks in this collection</p>
            <p className="text-xs text-gray-400">Drag tasks here or create new ones</p>
          </div>
        )}
      </div>
    </Card>
  );
}