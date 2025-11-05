'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Badge } from 'primereact/badge';
import { Divider } from 'primereact/divider';
import { useAuth } from '@/context/auth-context';
import { ViewType, Project } from '@/types/task';
import { useAppNavigation } from '@/lib/navigation';

interface SidebarProps {
  collapsed: boolean;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  currentProject?: Project;
  onProjectChange: (project: Project) => void;
}

export function Sidebar({ 
  collapsed, 
  currentView, 
  onViewChange, 
  currentProject,
  onProjectChange 
}: SidebarProps) {
  const { user } = useAuth();
  const { projects } = useAppNavigation();

  const viewOptions = [
    { type: 'kanban' as ViewType, label: 'Kanban Board', icon: 'pi pi-th-large' },
    { type: 'list' as ViewType, label: 'List View', icon: 'pi pi-list' },
    { type: 'calendar' as ViewType, label: 'Calendar', icon: 'pi pi-calendar' },
    { type: 'gantt' as ViewType, label: 'Timeline', icon: 'pi pi-chart-line' }
  ];

  if (collapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
        {/* Collapsed view - icons only */}
        <Avatar 
          label={user?.username?.charAt(0).toUpperCase()}
          size="normal"
          shape="circle"
          className="mb-4"
        />
        
        {viewOptions.map((view) => (
          <Button
            key={view.type}
            icon={view.icon}
            severity={currentView === view.type ? 'info' : 'secondary'}
            text={currentView !== view.type}
            onClick={() => onViewChange(view.type)}
            className="w-10 h-10"
            tooltip={view.label}
            tooltipOptions={{ position: 'right' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* View Selector */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Views</h4>
        <div className="space-y-1">
          {viewOptions.map((view) => (
            <Button
              key={view.type}
              icon={view.icon}
              label={view.label}
              severity={currentView === view.type ? 'info' : 'secondary'}
              text={currentView !== view.type}
              onClick={() => onViewChange(view.type)}
              className="w-full justify-start"
            />
          ))}
        </div>
      </div>

      <Divider />

      {/* Projects Section */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Projects</h4>
          <Button
            icon="pi pi-plus"
            size="small"
            severity="secondary"
            text
            tooltip="Create Project"
          />
        </div>
        
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                currentProject?.id === project.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onProjectChange(project)}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{project.name}</p>
                <p className="text-xs text-gray-500 truncate">{project.description}</p>
              </div>
              <Badge value="3" severity="secondary" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-100">
        <Button
          icon="pi pi-plus"
          label="New Project"
          severity="info"
          size="small"
          className="w-full mb-2"
        />
        <Button
          icon="pi pi-users"
          label="Invite Team"
          severity="secondary"
          size="small"
          className="w-full"
          text
        />
      </div>
    </div>
  );
}