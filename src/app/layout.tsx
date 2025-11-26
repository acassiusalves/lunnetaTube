
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { SearchProvider } from '@/context/SearchContext';
import { AuthProvider } from '@/context/AuthContext';
import { LayoutWrapper } from '@/components/layout-wrapper';


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
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <SearchProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </SearchProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
