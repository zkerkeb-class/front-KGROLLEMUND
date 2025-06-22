'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../styles/Subscription.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Navbar from '@/components/Navbar';
import { getUser } from '@/services/authService';

export default function SubscriptionSuccess() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUser();
        setUser(userData);
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Rediriger vers la page d'accueil après 5 secondes
    const redirectTimer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Chargement...</div>;
  }

  return (
    <>
      {user && <Navbar user={user} />}
      <div className={styles.pageContainer}>
        <button className={styles.backButton} onClick={handleGoHome}>
          <FontAwesomeIcon icon={faArrowLeft} /> Retour
        </button>
        
        <div className={styles.successContainer}>
          <FontAwesomeIcon icon={faCheckCircle} className={styles.successIcon} />
          <h1>Abonnement activé avec succès !</h1>
          <p>Merci pour votre abonnement. Votre compte a été mis à niveau vers la version Premium.</p>
          <p>Vous avez maintenant accès à toutes les fonctionnalités premium de notre plateforme.</p>
          <p className={styles.redirectMessage}>Vous serez redirigé vers la page d'accueil dans quelques secondes...</p>
          <button 
            className={styles.homeButton}
            onClick={handleGoHome}
          >
            Retourner à l&apos;accueil maintenant
          </button>
        </div>
      </div>
    </>
  );
} 