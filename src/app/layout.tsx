
import type { Metadata } from 'next';
import Link from 'next/link';
import { Bot, LayoutDashboard, Settings, TrendingUp, Shield, Facebook } from 'lucide-react';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { SearchProvider } from '@/context/SearchContext';
import { AuthProvider } from '@/context/AuthContext';


export const metadata: Metadata = {
  title: 'Analisador de Mercado',
  description: 'Análise de mercado com tecnologia de IA para conteúdo de vídeo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <SearchProvider>
            <div className="flex min-h-screen w-full flex-col">
              <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6 z-50">
                <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
                  <Link href="/buscador-youtube" className="flex items-center gap-2 text-lg font-semibold md:text-base">
                    <Logo />
                    <span className="sr-only">Analisador de Mercado</span>
                  </Link>
                  <Link href="/buscador-youtube" className="text-muted-foreground transition-colors hover:text-foreground">
                    Painel
                  </Link>
                  <Link href="/trending" className="text-muted-foreground transition-colors hover:text-foreground">
                    Tendências
                  </Link>
                  <Link href="/fb-library" className="text-muted-foreground transition-colors hover:text-foreground">
                    FB Biblioteca
                  </Link>
                  <Link href="/admin" className="text-muted-foreground transition-colors hover:text-foreground">
                    Admin
                  </Link>
                   <Link href="/settings" className="text-muted-foreground transition-colors hover:text-foreground">
                    Configurações
                   </Link>
                </nav>
                <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
                    <div className="ml-auto flex-1 sm:flex-initial">
                        {/* Mobile Menu could be here */}
                    </div>
                    <UserNav />
                </div>
              </header>
              <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                {children}
              </main>
            </div>
          </SearchProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
