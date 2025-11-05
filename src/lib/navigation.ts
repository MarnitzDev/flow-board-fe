'use client';

import { useRouter, useParams, usePathname } from 'next/navigation';
import { ViewType, Project } from '@/types/task';
import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

export function useAppNavigation() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const { isAuthenticated, token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      if (!isAuthenticated || !token) {
        console.log('Navigation: Not authenticated, skipping projects fetch');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Navigation: Fetching projects...');
        
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Navigation: Projects response:', data);
          
          if (data.success && data.data) {
            // Transform API response to match frontend types
            const transformedProjects: Project[] = data.data.map((project: any) => ({
              id: project._id,
              name: project.name,
              description: project.description,
              color: project.color,
              createdBy: project.createdBy,
              members: [], // Will be populated with actual user objects when needed
              createdAt: new Date(project.createdAt),
              updatedAt: new Date(project.updatedAt)
            }));
            
            setProjects(transformedProjects);
          }
        } else {
          console.error('Navigation: Failed to fetch projects:', response.status);
          setProjects([]);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        // Fallback to empty array or show error state
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [isAuthenticated, token]);

  const currentProject = projects.find(p => p.id === currentProjectId) || projects[0];

  const navigateToProject = (projectId: string, view: ViewType = 'kanban') => {
    router.push(`/dashboard/projects/${projectId}/${view}`);
  };

  const navigateToView = (view: ViewType) => {
    if (currentProjectId) {
      router.push(`/dashboard/projects/${currentProjectId}/${view}`);
    } else {
      // Default to first project if none selected
      const defaultProjectId = projects[0]?.id || '1';
      router.push(`/dashboard/projects/${defaultProjectId}/${view}`);
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
    isLoading,
    navigateToProject,
    navigateToView,
    navigateToDashboard,
    pathname
  };
}