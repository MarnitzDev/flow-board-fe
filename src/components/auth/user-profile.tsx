'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';

export function UserProfile() {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">Welcome, {user.username}!</h3>
        <p className="text-sm text-gray-600">{user.email}</p>
        <p className="text-xs text-gray-500 capitalize">Role: {user.role}</p>
      </div>
      <button
        onClick={logout}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Logout
      </button>
    </div>
  );
}