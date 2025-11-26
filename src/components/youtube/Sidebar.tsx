'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, TrendingUp, Facebook, Shield, Settings, FileText } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Início', href: '/buscador-youtube' },
  { icon: TrendingUp, label: 'Tendências', href: '/trending' },
  { icon: FileText, label: 'Página de Venda', href: '/sales-page' },
  { icon: Facebook, label: 'Biblioteca FB', href: '/fb-library' },
  { icon: Shield, label: 'Admin', href: '/admin' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
];

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-6 px-4 py-3 hover:bg-[#FFE9D6] transition-colors relative group ${
                isActive ? 'bg-[#FFE9D6]' : ''
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF6B00]" />
              )}

              <Icon
                className={`w-6 h-6 flex-shrink-0 ${
                  isActive ? 'text-[#FF6B00]' : 'text-[#606060]'
                }`}
                strokeWidth={isActive ? 2 : 1.5}
              />

              <span
                className={`text-sm font-normal whitespace-nowrap transition-opacity ${
                  isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                } ${isActive ? 'font-medium text-[#FF6B00]' : 'text-[#0f0f0f]'}`}
              >
                {item.label}
              </span>

              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-3 py-2 bg-[#FF6B00] text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
  );
}
