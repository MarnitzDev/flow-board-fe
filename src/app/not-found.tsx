'use client';

import { Button } from 'primereact/button';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The project or view you&apos;re looking for doesn&apos;t exist.
        </p>
        <div className="space-x-4">
          <Button
            label="Go to Dashboard"
            onClick={() => router.push('/dashboard')}
            className="mr-2"
          />
          <Button
            label="Go Back"
            severity="secondary"
            onClick={() => router.back()}
            text
          />
        </div>
      </div>
    </div>
  );
}