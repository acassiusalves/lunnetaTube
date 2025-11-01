'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface YouTubeLayoutProps {
  children: React.ReactNode;
}

export function YouTubeLayout({ children }: YouTubeLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="fixed inset-0 bg-white overflow-hidden">
      <Header onMenuClick={toggleSidebar} />

      <div className="flex h-[calc(100vh-3.5rem)]">
        <Sidebar isCollapsed={isSidebarCollapsed} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
