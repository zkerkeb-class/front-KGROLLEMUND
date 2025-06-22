'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './oauth-callback.module.css';
import { getUser } from '@/services/authService';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  
  useEffect(() => {
    const token = searchParams.get('token');
    const userData = searchParams.get('userData');
    
    if (token) {
      try {
        // Stocker le token
        localStorage.setItem('token', token);
        
        // Stocker les données utilisateur si disponibles
        if (userData) {
          const user = JSON.parse(decodeURIComponent(userData));
          localStorage.setItem('user', JSON.stringify(user));
          
          // Définir un cookie pour indiquer si le profil est complété
          document.cookie = `isProfileCompleted=${user.isProfileCompleted ? 'true' : 'false'}; path=/; max-age=86400`;
          
          // Si le profil n'est pas complété, rediriger vers la page de complétion
          if (!user.isProfileCompleted) {
            router.push('/complete-profile');
            return;
          }
        } else {
          // Si les données utilisateur ne sont pas disponibles, récupérer les informations utilisateur
          fetchUserData(token);
        }
        
        // Rediriger vers la page d'accueil
        router.push('/');
      } catch (error) {
        console.error('Erreur lors du traitement des données OAuth:', error);
        setError("Une erreur est survenue lors de l'authentification");
        
        // En cas d'erreur, rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } else {
      // En cas d'erreur, rediriger vers la page de connexion
      router.push('/login');
    }
  }, [router, searchParams]);
  
  // Fonction pour récupérer les données utilisateur avec le service authService
  const fetchUserData = async (token) => {
    try {
      const user = await getUser();
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        
        // Définir un cookie pour indiquer si le profil est complété
        document.cookie = `isProfileCompleted=${user.isProfileCompleted ? 'true' : 'false'}; path=/; max-age=86400`;
        
        // Si le profil n'est pas complété, rediriger vers la page de complétion
        if (!user.isProfileCompleted) {
          router.push('/complete-profile');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
    }
  };
  
  return (
    <div className={styles.container}>
      {error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <div className={styles.loader}></div>
          <p>Authentification en cours...</p>
        </>
      )}
    </div>
  );
} 