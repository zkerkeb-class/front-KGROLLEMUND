'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './oauth-callback.module.css';

export default function OAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Stocker le token
      localStorage.setItem('token', token);
      
      // Rediriger vers la page d'accueil
      router.push('/');
    } else {
      // En cas d'erreur, rediriger vers la page de connexion
      router.push('/login');
    }
  }, [router, searchParams]);
  
  return (
    <div className={styles.container}>
      <div className={styles.loader}></div>
      <p>Authentification en cours...</p>
    </div>
  );
} 