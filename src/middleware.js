import { NextResponse } from 'next/server';

// Liste des chemins qui ne nécessitent pas d'authentification
const publicPaths = [
  '/login',
  '/oauth-callback',
  '/verify-email',
  '/reset-password',
  '/api/auth',
  '/api/profile/complete'
];

// Liste des chemins qui ne nécessitent pas de vérification de profil
const noProfileCheckPaths = [
  '/complete-profile',
  '/api/profile/complete'
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Vérifier si le chemin est public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Vérifier si le chemin est exempté de la vérification de profil
  const isNoProfileCheckPath = noProfileCheckPaths.some(path => pathname.startsWith(path));
  
  // Si c'est un chemin public, ne pas vérifier l'authentification
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Récupérer le token d'authentification
  const token = request.cookies.get('token')?.value;
  
  // Si l'utilisateur n'est pas authentifié, rediriger vers la page de connexion
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Si le chemin est exempté de la vérification de profil, ne pas vérifier
  if (isNoProfileCheckPath) {
    return NextResponse.next();
  }
  
  // Vérifier si le profil est complété (via le localStorage côté client)
  // Comme le middleware s'exécute côté serveur, nous utilisons un cookie pour cette information
  const isProfileCompleted = request.cookies.get('isProfileCompleted')?.value === 'true';
  
  // Si le profil n'est pas complété, rediriger vers la page de complétion
  if (!isProfileCompleted) {
    return NextResponse.redirect(new URL('/complete-profile', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
}; 