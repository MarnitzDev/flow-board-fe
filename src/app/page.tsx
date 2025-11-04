'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { AuthModal } from '@/components/auth/auth-modal';
import { UserProfile } from '@/components/auth/user-profile';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Flow Board</h1>
          <p className="text-lg text-gray-600">A modern project management application</p>
        </header>

        {isAuthenticated ? (
          <div className="space-y-6">
            <UserProfile />
            <div className="bg-white p-8 rounded-lg shadow">
              <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
              <p className="text-gray-600">Welcome to your Flow Board dashboard! This is where your projects and tasks will be displayed.</p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-white p-8 rounded-lg shadow max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
              <p className="text-gray-600 mb-6">Sign in to access your projects and collaborate with your team.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => openAuthModal('login')}
                  className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Login
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    </div>
  );
}
