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

  // Validate project ID - accept MongoDB ObjectIds (24 hex characters) or simple IDs
  const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(projectId);
  const isSimpleId = /^[0-9]+$/.test(projectId);
  
  if (!isValidObjectId && !isSimpleId) {
    notFound();
  }

  return <TaskLayout />;
}