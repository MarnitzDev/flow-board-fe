'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AuthModal } from '@/components/auth/auth-modal';
import { DashboardCard } from '@/components/dashboard/dashboard-card';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen surface-ground">
      {isAuthenticated ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Redirecting...</h2>
            <p className="text-gray-600">Taking you to your dashboard</p>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center space-y-6 mt-16">
            <Card className="max-w-md mx-auto">
              <div className="text-center p-6">
                <i className="pi pi-home text-6xl text-primary mb-4"></i>
                <h2 className="text-2xl font-semibold mb-4">Welcome to Flow Board</h2>
                <p className="text-600 mb-6">A modern project management application. Sign in to get started with organizing your projects and collaborating with your team.</p>
                
                <div className="flex flex-column gap-3">
                  <Button
                    label="Login"
                    icon="pi pi-sign-in"
                    className="w-full"
                    onClick={() => openAuthModal('login')}
                  />
                  <Button
                    label="Register"
                    icon="pi pi-user-plus"
                    severity="secondary"
                    className="w-full"
                    onClick={() => openAuthModal('register')}
                  />
                </div>
              </div>
            </Card>
          </div>

          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            initialMode={authMode}
          />
        </div>
      )}
    </div>
  );
}
