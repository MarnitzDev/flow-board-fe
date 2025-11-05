'use client';

import React from 'react';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { ListView } from '@/components/views/list-view';
import { CalendarView } from '@/components/views/calendar-view';
import { GanttView } from '@/components/views/gantt-view';
import { ViewType, TaskFilter, TaskSort, Task, Project, Board } from '@/types/task';

interface MainContentProps {
  viewType: ViewType;
  filters: TaskFilter;
  sorting: TaskSort;
  onTaskClick: (task?: Task) => void;
  currentProject?: Project;
  currentBoard?: Board;
  sidebarCollapsed: boolean;
}

export function MainContent({
  viewType,
  filters,
  sorting,
  onTaskClick,
  currentProject,
  currentBoard,
  sidebarCollapsed
}: MainContentProps) {
  const getWidthClass = () => {
    return sidebarCollapsed ? 'calc(100vw - 4rem)' : 'calc(100vw - 20rem)';
  };

  const renderView = () => {
    switch (viewType) {
      case 'kanban':
        return (
          <KanbanBoard
            filters={filters}
            sorting={sorting}
            onTaskClick={onTaskClick}
            currentProject={currentProject}
            currentBoard={currentBoard}
          />
        );
      case 'list':
        return (
          <ListView
            filters={filters}
            sorting={sorting}
            onTaskClick={onTaskClick}
            currentProject={currentProject}
          />
        );
      case 'calendar':
        return (
          <CalendarView
            filters={filters}
            onTaskClick={onTaskClick}
            currentProject={currentProject}
          />
        );
      case 'gantt':
        return (
          <GanttView
            filters={filters}
            onTaskClick={onTaskClick}
            currentProject={currentProject}
          />
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Select a view to get started</p>
          </div>
        );
    }
  };

  return (
    <div 
      className="flex-1 bg-gray-50 overflow-hidden"
      style={{ width: getWidthClass() }}
    >
      {renderView()}
    </div>
  );
}