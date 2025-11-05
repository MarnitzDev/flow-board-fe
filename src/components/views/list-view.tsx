'use client';

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TaskFilter, TaskSort, Task, Project } from '@/types/task';

interface ListViewProps {
  filters: TaskFilter;
  sorting: TaskSort;
  onTaskClick: (task?: Task) => void;
  currentProject?: Project;
}

export function ListView({ filters, sorting, onTaskClick, currentProject }: ListViewProps) {
  // Mock data for demonstration
  const mockTasks = [
    { id: '1', title: 'Design login flow', status: 'todo', priority: 'high', assignee: 'John Doe' },
    { id: '2', title: 'Setup database', status: 'todo', priority: 'medium', assignee: 'Unassigned' },
    { id: '3', title: 'Implement auth', status: 'in-progress', priority: 'high', assignee: 'Jane Smith' }
  ];

  return (
    <div className="h-full p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Task List</h2>
        </div>
        <DataTable value={mockTasks} className="p-datatable-sm">
          <Column field="title" header="Task" />
          <Column field="status" header="Status" />
          <Column field="priority" header="Priority" />
          <Column field="assignee" header="Assignee" />
        </DataTable>
      </div>
    </div>
  );
}