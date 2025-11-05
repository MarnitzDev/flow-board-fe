'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const router = useRouter();
  const { projectId } = React.use(params);

  useEffect(() => {
    // Redirect to default view for this project
    if (projectId) {
      router.replace(`/dashboard/projects/${projectId}/kanban`);
    }
  }, [router, projectId]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Loading Project...</h2>
        <p className="text-gray-600">Redirecting to Kanban view</p>
      </div>
    </div>
  );
}