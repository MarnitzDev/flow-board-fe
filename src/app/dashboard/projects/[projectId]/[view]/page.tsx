'use client';

import React from 'react';
import { TaskLayout } from '@/components/layout/task-layout';
import { notFound } from 'next/navigation';

interface ProjectViewPageProps {
  params: Promise<{
    projectId: string;
    view: string;
  }>;
}

export default function ProjectViewPage({ params }: ProjectViewPageProps) {
  const { projectId, view } = React.use(params);

  // Validate view parameter
  const validViews = ['kanban', 'list', 'calendar', 'gantt'];
  if (!validViews.includes(view)) {
    notFound();
  }

  // Validate project ID (simple check for now)
  const validProjects = ['1', '2', '3'];
  if (!validProjects.includes(projectId)) {
    notFound();
  }

  return <TaskLayout />;
}