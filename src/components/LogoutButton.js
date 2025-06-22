'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Cookies from 'js-cookie';
import { logout } from '@/services/authService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { authAPI } from '@/services/axiosConfig';

export default function LogoutButton({ className }) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Fonction pour déterminer le provider depuis le token
    const getProviderFromToken = (token) => {
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log('Token payload:', payload);
                // Chercher le provider dans différents champs possibles
                return payload.provider || payload.oauthProvider || '';
            }
        } catch (e) {
            console.error('Erreur lors du décodage du token:', e);
        }
        return '';
    };

    const handleLogout = async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        console.log('Début du processus de déconnexion');

        try {
            // 1. Récupérer le token depuis localStorage ou cookies
            const token = localStorage.getItem('token') || Cookies.get('auth_token');
            
            if (!token) {
                console.log('Pas de token trouvé, redirection vers login');
                window.location.href = '/login';
                return;
            }

            console.log('Token trouvé:', token.substring(0, 15) + '...');

            // 2. Déterminer le provider depuis le token
            const provider = getProviderFromToken(token);
            console.log('Provider détecté:', provider || 'Aucun');
            
            // Stocker le provider pour la page de login
            if (provider) {
                localStorage.setItem('lastProvider', provider);
            }

            // Configurer le token dans les en-têtes pour l'appel à l'API
            authAPI.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // 3. Nettoyer le stockage côté client d'abord
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            
            // Supprimer tous les cookies
            document.cookie.split(';').forEach(cookie => {
                const trimmedCookie = cookie.trim();
                const cookieName = trimmedCookie.split('=')[0];
                document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
            });
            
            console.log('Stockage local nettoyé');

            // 4. Gérer la déconnexion selon le provider
            if (provider && provider.toLowerCase() === 'google') {
                console.log('Déconnexion Google via popup');
                
                // Ouvrir dans un popup la déconnexion Google exactement comme dans CLIENT
                const googleLogoutUrl = 'https://accounts.google.com/Logout';
                const popup = window.open(googleLogoutUrl, "logout", "width=600,height=400");
                
                // Attendre un peu pour être sûr que la déconnexion s'effectue
                setTimeout(() => {
                    if (popup) popup.close();
                    console.log('Popup fermé, redirection vers la page de login');
                    window.location.href = '/login?logout=success&provider=google';
                }, 2000);
            } 
            else if (provider && provider.toLowerCase() === 'github') {
                console.log('Déconnexion GitHub via popup');
                
                // Appeler d'abord le service de déconnexion pour nettoyer côté serveur
                try {
                    // Appel explicite à l'API avec le provider
                    await authAPI.post('/auth/logout', { provider: 'github' });
                } catch (error) {
                    console.error('Erreur lors de l\'appel au service de déconnexion:', error);
                }
                
                // Version manuelle - GitHub nécessite d'être connecté pour voir la page de déconnexion
                // Pour GitHub, simplement rediriger vers la page d'accueil car la déconnexion est déjà effectuée
                console.log('Redirection vers la page de login après déconnexion GitHub');
                window.location.href = '/login?logout=success&provider=github';
            }
            else if (provider && provider.toLowerCase() === 'linkedin') {
                console.log('Déconnexion LinkedIn');
                
                // Appeler d'abord le service de déconnexion pour nettoyer côté serveur
                try {
                    // Appel explicite à l'API avec le provider
                    await authAPI.post('/auth/logout', { provider: 'linkedin' });
                } catch (error) {
                    console.error('Erreur lors de l\'appel au service de déconnexion:', error);
                }
                
                // Pour LinkedIn, l'URL de déconnexion standard ne fonctionne pas bien
                // Rediriger directement vers la page de login
                console.log('Redirection vers la page de login après déconnexion LinkedIn');
                window.location.href = '/login?logout=success&provider=linkedin';
            }
            else {
                // Pour les comptes classiques
                try {
                    console.log('Appel du service de déconnexion');
                    await authAPI.post('/auth/logout', { provider: provider || '' });
                    
                    // Compte classique
                    window.location.href = '/login?logout=success';
                } catch (apiError) {
                    console.error('Erreur lors de l\'appel au service de déconnexion:', apiError);
                    window.location.href = '/login?logout=error';
                }
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            // Nettoyage de sécurité
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.clear();
            Cookies.remove('auth_token', { path: '/' });
            window.location.href = '/login';
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors ${
                isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
            } ${className || ''}`}
        >
            <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
            {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
        </button>
    );
} 