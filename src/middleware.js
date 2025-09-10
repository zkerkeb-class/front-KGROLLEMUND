import { NextResponse } from 'next/server';

// Liste des chemins qui ne nécessitent pas d'authentification
const publicPaths = [
  '/login',
  '/oauth-callback',
  '/verify-email',
  '/reset-password',
  '/api/auth',
  '/api/profile/complete',
  '/api/metrics'
];

// Liste des chemins qui ne nécessitent pas de vérification de profil
const noProfileCheckPaths = [
  '/complete-profile',
  '/api/profile/complete'
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Récupérer les cookies
  const token = request.cookies.get('token')?.value;
  const isProfileCompleted = request.cookies.get('isProfileCompleted')?.value === 'true';

  // Chemins publics accessibles sans authentification
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Si l'utilisateur est sur un chemin public, on le laisse passer
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Si l'utilisateur n'a pas de token, on le redirige vers le login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si l'utilisateur est authentifié (a un token)
  // et que son profil n'est pas complété...
  if (!isProfileCompleted) {
    // ... et qu'il n'est PAS déjà sur la page pour compléter son profil
    // ou une API nécessaire, on le redirige.
    if (!noProfileCheckPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL('/complete-profile', request.url));
    }
  }

  // Si l'utilisateur est authentifié et que son profil est complété,
  // mais qu'il essaie d'accéder à des pages restreintes, on le laisse passer.
  // (ou rediriger vers le tableau de bord si nécessaire)
  
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