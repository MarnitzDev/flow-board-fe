'use client';

import React, { useState } from 'react';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { InputText } from 'primereact/inputtext';
import { useAuth } from '@/context/auth-context';
import { AuthModal } from '@/components/auth/auth-modal';
import { useAppNavigation } from '@/lib/navigation';
import { ViewType } from '@/types/task';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const { currentProject, currentView } = useAppNavigation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const menu = React.useRef<Menu>(null);

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const getViewLabel = (view?: ViewType): string => {
    switch (view) {
      case 'kanban': return 'Kanban Board';
      case 'list': return 'List View';
      case 'calendar': return 'Calendar';
      case 'gantt': return 'Timeline';
      default: return '';
    }
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
        // Show immediate feedback
        console.log('Logging out...');
        logout();
      }
    }
  ];

  const startContent = (
    <div className="flex items-center gap-2">
      {onToggleSidebar && (
        <Button
          icon="pi pi-bars"
          severity="secondary"
          text
          onClick={onToggleSidebar}
          className="md:hidden"
        />
      )}
      <span className="font-bold text-2xl text-primary">Flow Board</span>
      {currentProject && (
        <>
          <i className="pi pi-chevron-right text-gray-400"></i>
          <span className="text-lg font-medium text-gray-700">{currentProject.name}</span>
          {currentView && (
            <>
              <i className="pi pi-chevron-right text-gray-400"></i>
              <span className="text-md text-gray-600">{getViewLabel(currentView)}</span>
            </>
          )}
        </>
      )}
    </div>
  );

  const centerContent = isAuthenticated && (
    <div className="hidden md:flex items-center gap-2 max-w-md w-full">
      <span className="pi pi-search text-gray-400"></span>
      <InputText
        placeholder="Search tasks, projects..."
        className="w-full border-none shadow-none"
      />
    </div>
  );

  const endContent = (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <>
          <Button
            icon="pi pi-bell"
            severity="secondary"
            text
            badge="2"
            badgeClassName="p-badge-danger"
          />
          <span className="text-sm text-gray-600 hidden lg:block">Welcome, {user?.username}</span>
          <Avatar 
            label={user?.username?.charAt(0).toUpperCase()} 
            className="cursor-pointer" 
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
        center={centerContent}
        end={endContent}
        className="border-none border-bottom-1 surface-border px-4"
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