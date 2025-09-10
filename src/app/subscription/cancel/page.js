'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../../../styles/Subscription.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import Navbar from '@/components/Navbar';
import { getUser } from '@/services/authService';

export default function SubscriptionCancel() {
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
  }, []);

  const handleGoBack = () => {
    router.push('/subscription');
  };

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
        <button className={styles.backButton} onClick={handleGoBack}>
          <FontAwesomeIcon icon={faArrowLeft} /> Retour
        </button>
        
        <div className={styles.cancelContainer}>
          <FontAwesomeIcon icon={faTimesCircle} className={styles.cancelIcon} />
          <h1>Abonnement annulé</h1>
          <p>Le processus d&apos;abonnement a été annulé. Aucun montant n&apos;a été débité.</p>
          <p>Si vous avez rencontré des problèmes ou si vous avez des questions, n&apos;hésitez pas à contacter notre support.</p>
          
          <div className={styles.actionButtons}>
            <button 
              className={styles.tryAgainButton}
              onClick={handleGoBack}
            >
              Réessayer
            </button>
            
            <button 
              className={styles.homeButton}
              onClick={handleGoHome}
            >
              Retourner à l&apos;accueil
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 