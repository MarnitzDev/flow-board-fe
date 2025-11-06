'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MainContent } from '@/components/layout/main-content';
import { RightPanel } from '@/components/layout/right-panel';
import { Header } from '@/components/layout/header';
import { Task, Project } from '@/types/task';
import { useAppNavigation } from '@/lib/navigation';

export function TaskLayout() {
  const { 
    currentProject, 
    currentView, 
    navigateToProject, 
    navigateToView 
  } = useAppNavigation();

  // UI state that's not related to routing
  const [uiState, setUIState] = useState({
    sidebarCollapsed: false,
    rightPanelOpen: false,
    selectedTask: undefined as Task | undefined,
    currentBoard: undefined
  });

  const toggleSidebar = () => {
    setUIState(prev => ({
      ...prev,
      sidebarCollapsed: !prev.sidebarCollapsed
    }));
  };

  const openTaskDialog = (task?: Task) => {
    setUIState(prev => ({
      ...prev,
      rightPanelOpen: true,
      selectedTask: task
    }));
  };

  const closeTaskDialog = () => {
    setUIState(prev => ({
      ...prev,
      rightPanelOpen: false,
      selectedTask: undefined
    }));
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <Header 
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          collapsed={uiState.sidebarCollapsed}
          currentView={currentView}
          onViewChange={navigateToView}
          currentProject={currentProject}
          onProjectChange={(project: Project) => 
            navigateToProject(project.id, currentView)
          }
        />

        {/* Main Content Area */}
        <MainContent
          viewType={currentView}
          filters={{}}
          sorting={{
            field: 'createdAt',
            direction: 'desc'
          }}
          onTaskClick={openTaskDialog}
          currentProject={currentProject}
          currentBoard={uiState.currentBoard}
          sidebarCollapsed={uiState.sidebarCollapsed}
        />

        {/* Task Dialog */}
        <RightPanel
          isOpen={uiState.rightPanelOpen}
          task={uiState.selectedTask}
          onClose={closeTaskDialog}
          onTaskUpdate={(updatedTask: Task) => {
            setUIState(prev => ({
              ...prev,
              selectedTask: updatedTask
            }));
          }}
        />
      </div>
    </div>
  );
}