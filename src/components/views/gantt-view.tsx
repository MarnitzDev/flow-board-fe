'use client';

import React from 'react';
import { TaskFilter, Task, Project } from '@/types/task';

interface GanttViewProps {
  filters: TaskFilter;
  onTaskClick: (task?: Task) => void;
  currentProject?: Project;
}

export function GanttView({ filters, onTaskClick, currentProject }: GanttViewProps) {
  return (
    <div className="h-full p-6 flex items-center justify-center">
      <div className="text-center">
        <i className="pi pi-chart-line text-6xl text-gray-300 mb-4"></i>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Timeline View</h3>
        <p className="text-gray-500">Coming soon - view project timelines and dependencies</p>
      </div>
    </div>
  );
}