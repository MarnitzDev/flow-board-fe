'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ApiTestPanel } from '@/components/debug/api-test-panel';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to default project and view
    router.replace('/dashboard/projects/1/kanban');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center max-w-2xl w-full">
        <h2 className="text-xl font-semibold mb-2">Loading Dashboard...</h2>
        <p className="text-gray-600 mb-8">Redirecting to your workspace</p>
        
        {/* Temporary API test panel for debugging */}
        <ApiTestPanel />
      </div>
    </div>
  );
}