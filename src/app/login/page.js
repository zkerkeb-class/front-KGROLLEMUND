'use client';

import AuthForm from '@/components/AuthForm';
import styles from './login.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptopCode } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Login() {
  const [logoutStatus, setLogoutStatus] = useState(false);
  const [logoutMessage, setLogoutMessage] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur a un token valide
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    // Si l'utilisateur a un token et des informations utilisateur, vérifier si nous sommes sur la page de logout
    if (token && user) {
      const logout = searchParams.get('logout');
      
      // Si ce n'est pas une déconnexion explicite, rediriger vers la page d'accueil
      if (logout !== 'success') {
        // Vérifier si le profil est complété
        try {
          const userData = JSON.parse(user);
          if (userData.isProfileCompleted) {
            router.push('/');
          } else {
            router.push('/complete-profile');
          }
          return;
        } catch (error) {
          console.error('Erreur lors de la lecture des données utilisateur:', error);
        }
      }
    }
    
    // Si c'est une déconnexion ou si l'utilisateur n'a pas de token valide
    if (searchParams.get('logout') === 'success') {
      // Nettoyer le stockage local et les cookies seulement lors d'une déconnexion explicite
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Nettoyage de tous les cookies
      document.cookie.split(';').forEach(cookie => {
        const trimmedCookie = cookie.trim();
        const cookieName = trimmedCookie.split('=')[0];
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      });
      
      console.log('Nettoyage de session effectué après déconnexion');
      
      // Supprimer l'information sur le dernier provider
      localStorage.removeItem('lastProvider');
    }
    
    // Gérer les erreurs de déconnexion
    if (searchParams.get('logout') === 'error') {
      setLogoutStatus(true);
      setLogoutMessage('Erreur lors de la déconnexion. Votre session a été nettoyée localement.');
      
      // Nettoyage local en cas d'erreur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Nettoyage de tous les cookies
      document.cookie.split(';').forEach(cookie => {
        const trimmedCookie = cookie.trim();
        const cookieName = trimmedCookie.split('=')[0];
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      });
    }
  }, [searchParams, router]);

  return (
    <div className={styles.container}>
      {logoutStatus && (
        <div className={styles.logoutNotification}>
          {logoutMessage}
        </div>
      )}
      <div className={styles.loginWrapper}>
        <div className={styles.imageSection}>
          <div className={styles.overlay}>
            <p className={styles.quote}>
              &ldquo;Notre générateur de devis alimenté par l&apos;IA vous permet de créer des estimations précises pour vos projets de développement web en quelques minutes.&rdquo;
            </p>
            <p className={styles.author}>- Équipe Quote Generator</p>
          </div>
        </div>
        <div className={styles.formSection}>
          <div className={styles.formContainer}>
            <div className={styles.logo}>
              <FontAwesomeIcon icon={faLaptopCode} />
              QuoteGen
            </div>
            <AuthForm />
          </div>
        </div>
      </div>
    </div>
  );
} 