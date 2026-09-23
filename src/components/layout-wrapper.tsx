'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/youtube/Sidebar';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import Link from 'next/link';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Don't show sidebar on auth pages
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  if (isAuthPage) {
    return <>{children}</>;
  }

  const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-60';

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <div className={`shrink-0 transition-all duration-300 ${sidebarWidth}`}>
        <div className={`fixed top-0 left-0 h-screen flex flex-col border-r bg-white ${sidebarWidth} overflow-hidden transition-all duration-300`}>
          {/* Logo and Toggle */}
          <div className={`flex items-center justify-between p-4 border-b ${isCollapsed ? 'justify-center' : ''}`}>
            {!isCollapsed && (
              <Link href="/buscador-youtube" className="flex items-center gap-2 min-w-0 flex-1">
                <Logo />
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-9 w-9 shrink-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            <Sidebar isCollapsed={isCollapsed} />
          </div>

          {/* User Navigation at Bottom */}
          <div className={`border-t p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
            <UserNav isCollapsed={isCollapsed} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="min-w-0 flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
