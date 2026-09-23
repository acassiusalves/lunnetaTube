'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, TrendingUp, Facebook, Shield, Settings, FileText, Smartphone } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  { icon: Smartphone, label: 'Shorts', href: '/shorts' },
  { icon: FileText, label: 'Página de Venda', href: '/sales-page' },
  { icon: Facebook, label: 'Biblioteca FB', href: '/fb-library' },
  { icon: Shield, label: 'Admin', href: '/admin' },
  { icon: Settings, label: 'Configurações', href: '/settings' },
];

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    // O rótulo do menu recolhido usa o Tooltip do Radix, que é renderizado fora da
    // árvore (portal): um tooltip absoluto dentro da nav seria cortado pelo
    // contêiner com overflow-y-auto que envolve o menu
    <TooltipProvider delayDuration={0}>
      <nav className="py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href);

          const Icon = item.icon;

          const link = (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 hover:bg-[#FFE9D6] transition-colors relative ${
                isCollapsed ? 'justify-center' : 'gap-6'
              } ${isActive ? 'bg-[#FFE9D6]' : ''}`}
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
            </Link>
          );

          if (!isCollapsed) return link;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>{link}</TooltipTrigger>
              <TooltipContent side="right" className="border-0 bg-[#FF6B00] px-3 py-2 text-white">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
