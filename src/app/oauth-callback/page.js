'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Cookies from 'js-cookie';
import styles from './oauth-callback.module.css';
import { getUser } from '@/services/authService';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError("Le token d'authentification est manquant. Redirection vers la page de connexion...");
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      return;
    }

    // Le token est présent, on le sauvegarde et on récupère les données utilisateur
    Cookies.set('token', token, { expires: 1, path: '/', sameSite: 'lax' });

    const handleAuthentication = async () => {
      try {
        const user = await getUser();
        if (user) {
          // Sauvegarder l'état de complétion du profil dans un cookie pour le middleware
          Cookies.set('isProfileCompleted', user.isProfileCompleted ? 'true' : 'false', { expires: 1, path: '/' });

          // Rediriger vers la page appropriée
          if (user.isProfileCompleted) {
            router.push('/'); // Ou '/dashboard'
          } else {
            router.push('/complete-profile');
          }
        } else {
          throw new Error('Les données utilisateur n\'ont pas pu être récupérées.');
        }
      } catch (e) {
        console.error('Erreur lors de la récupération des données utilisateur après le callback OAuth:', e);
        setError('Une erreur est survenue lors de la finalisation de votre connexion. Veuillez réessayer.');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleAuthentication();

  }, [router, searchParams]);
  
  return (
    <div className={styles.container}>
      {error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <div className={styles.loader}></div>
          <p>Finalisation de l&apos;authentification...</p>
        </>
      )}
    </div>
  );
} 