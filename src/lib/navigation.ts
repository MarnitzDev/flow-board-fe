'use client';

import { useRouter, useParams, usePathname } from 'next/navigation';
import { ViewType, Project } from '@/types/task';
import { useMemo } from 'react';

export function useAppNavigation() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // Extract current state from URL - handle both sync and async params
  const currentProjectId = useMemo(() => {
    if (params?.projectId) {
      return Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
    }
    return null;
  }, [params]);

  const currentView = useMemo(() => {
    if (params?.view) {
      const view = Array.isArray(params.view) ? params.view[0] : params.view;
      return (view as ViewType) || 'kanban';
    }
    return 'kanban';
  }, [params]);

  // Mock projects - in real app, this would come from API/context
  const projects: Project[] = [
    { id: '1', name: 'My Tasks', description: 'Personal workspace', color: '#3B82F6', createdBy: '1', members: [], createdAt: new Date(), updatedAt: new Date() },
    { id: '2', name: 'Team Project', description: 'Collaborative work', color: '#10B981', createdBy: '1', members: [], createdAt: new Date(), updatedAt: new Date() },
    { id: '3', name: 'Bug Fixes', description: 'Track and resolve bugs', color: '#EF4444', createdBy: '1', members: [], createdAt: new Date(), updatedAt: new Date() }
  ];

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  const navigateToProject = (projectId: string, view: ViewType = 'kanban') => {
    router.push(`/dashboard/projects/${projectId}/${view}`);
  };

  const navigateToView = (view: ViewType) => {
    if (currentProjectId) {
      router.push(`/dashboard/projects/${currentProjectId}/${view}`);
    } else {
      // Default to first project if none selected
      router.push(`/dashboard/projects/${projects[0].id}/${view}`);
    }
  };

  const navigateToDashboard = () => {
    router.push('/dashboard');
  };

  return {
    currentProject,
    currentView,
    currentProjectId,
    projects,
    navigateToProject,
    navigateToView,
    navigateToDashboard,
    pathname
  };
}