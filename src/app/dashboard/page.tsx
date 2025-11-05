'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediate redirect to default project and view
    router.replace('/dashboard/projects/1/kanban');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center max-w-2xl w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Loading Dashboard...</h2>
        <p className="text-gray-600">Redirecting to your workspace</p>
      </div>
    </div>
  );
}