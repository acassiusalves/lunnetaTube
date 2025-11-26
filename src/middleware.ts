import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas que não precisam de autenticação
const publicRoutes = ['/login', '/signup'];

// Rotas protegidas que requerem autenticação
const protectedRoutes = [
  '/buscador-youtube',
  '/trending',
  '/sales-page',
  '/fb-library',
  '/admin',
  '/settings',
  '/analyze',
  '/product-modeling'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Verificar se há um token de sessão (Firebase usa __session)
  const sessionCookie = request.cookies.get('__session');
  const hasAuthToken = !!sessionCookie;

  // Se é rota protegida e não está autenticado, redirecionar para login
  if (isProtectedRoute && !hasAuthToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se está na página de login/signup e já está autenticado, redirecionar para dashboard
  if (isPublicRoute && hasAuthToken) {
    return NextResponse.redirect(new URL('/buscador-youtube', request.url));
  }

  // Se está na raiz e autenticado, redirecionar para dashboard
  if (pathname === '/' && hasAuthToken) {
    return NextResponse.redirect(new URL('/buscador-youtube', request.url));
  }

  // Se está na raiz e não autenticado, redirecionar para login
  if (pathname === '/' && !hasAuthToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Configurar quais rotas o middleware deve processar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
