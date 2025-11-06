'use client';

import React from 'react';
import { Task } from '@/types/task';
import { Card } from 'primereact/card';

interface UncategorizedSectionProps {
  tasks: Task[];
  children?: React.ReactNode;
}

export function UncategorizedSection({ tasks, children }: UncategorizedSectionProps) {
  // Filter out subtasks for the main view
  const mainTasks = tasks.filter(task => !task.isSubtask);

  if (mainTasks.length === 0 && !children) {
    return null; // Don't show if no uncategorized tasks
  }

  return (
    <Card className="uncategorized-section mb-4 border-l-4 border-l-gray-400">
      <div className="uncategorized-header p-3 mb-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <h3 className="font-semibold text-gray-800">Uncategorized</h3>
          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
            {mainTasks.length} tasks
          </span>
        </div>
        <p className="text-sm text-gray-600 mt-2 ml-6">
          Tasks not assigned to any collection
        </p>
      </div>
      
      {/* Task Content Area */}
      <div className="uncategorized-tasks px-3 pb-3">
        {children}
        
        {/* Empty State */}
        {mainTasks.length === 0 && !children && (
          <div className="text-center py-4 text-gray-500">
            <i className="pi pi-check-circle text-2xl mb-2 block"></i>
            <p className="text-sm">All tasks are organized in collections</p>
          </div>
        )}
      </div>
    </Card>
  );
}