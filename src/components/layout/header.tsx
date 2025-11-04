'use client';

import React, { useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { useAuth } from '@/context/auth-context';
import { AuthModal } from '@/components/auth/auth-modal';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const menu = React.useRef<Menu>(null);

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const userMenuItems = [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => {
        // Handle profile navigation
        console.log('Navigate to profile');
      }
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        // Handle settings navigation
        console.log('Navigate to settings');
      }
    },
    {
      separator: true
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => {
        logout();
      }
    }
  ];

  const startContent = (
    <div className="flex items-center gap-2">
      <span className="font-bold text-2xl text-primary">Flow Board</span>
    </div>
  );

  const endContent = (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <>
          <span className="text-sm text-600 mr-2">Welcome, {user?.username}</span>
          <Avatar 
            label={user?.username?.charAt(0).toUpperCase()} 
            className="mr-2 cursor-pointer" 
            size="normal" 
            shape="circle"
            style={{ backgroundColor: '#2196F3', color: '#ffffff' }}
            onClick={(e) => menu.current?.toggle(e)}
          />
          <Menu ref={menu} model={userMenuItems} popup />
        </>
      ) : (
        <div className="flex gap-2">
          <Button 
            label="Login" 
            icon="pi pi-sign-in" 
            severity="secondary"
            text
            onClick={() => openAuthModal('login')}
          />
          <Button 
            label="Register" 
            icon="pi pi-user-plus" 
            onClick={() => openAuthModal('register')}
          />
        </div>
      )}
    </div>
  );

  return (
    <>
      <Toolbar 
        start={startContent} 
        end={endContent}
        className="border-none border-bottom-1 surface-border"
        style={{ 
          borderRadius: '0',
          background: 'var(--surface-0)',
          borderBottom: '1px solid var(--surface-border)'
        }}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </>
  );
}