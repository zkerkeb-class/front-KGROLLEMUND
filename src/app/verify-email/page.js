'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/utils/api';
import styles from './verify-email.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    // Vérifier si les paramètres sont présents
    if (!token || !email) {
      setError('Lien de vérification invalide ou expiré.');
      setVerifying(false);
      return;
    }
    
    // Fonction de vérification
    const verifyEmailToken = async () => {
      try {
        // Vérifier l'email
        const verifyResponse = await authService.verifyEmail(token, email);
        setSuccess(true);
        
        // Si la vérification réussit, le backend retourne déjà un token et les infos utilisateur
        if (verifyResponse.token && verifyResponse.user) {
          // Stocker le token et les informations utilisateur dans localStorage
          localStorage.setItem('token', verifyResponse.token);
          localStorage.setItem('user', JSON.stringify(verifyResponse.user));
          
          // Stocker le token dans un cookie également
          document.cookie = `token=${verifyResponse.token}; path=/; max-age=86400`;
          
          // Définir un cookie pour indiquer si le profil est complété
          document.cookie = `isProfileCompleted=${verifyResponse.user.isProfileCompleted ? 'true' : 'false'}; path=/; max-age=86400`;
          
          console.log('Token stocké dans localStorage et cookies après vérification email');
          
          // Rediriger vers la page de complétion de profil après 3 secondes
          setTimeout(() => {
            router.push('/complete-profile');
          }, 3000);
        } else {
          // Si pas de token dans la réponse, rediriger vers la page de login
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'email:', err);
        setError(err.message || 'Une erreur est survenue lors de la vérification de l\'email.');
        setVerifying(false);
      } finally {
        setVerifying(false);
      }
    };
    
    verifyEmailToken();
  }, [token, email, router]);
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Vérification de l&apos;email</h2>
        
        {verifying && (
          <div className={styles.verifying}>
            <FontAwesomeIcon icon={faSpinner} spin className={styles.spinner} />
            <p>Vérification de votre adresse email en cours...</p>
          </div>
        )}
        
        {error && (
          <div className={styles.error}>
            <FontAwesomeIcon icon={faExclamationTriangle} className={styles.icon} />
            <div>
              <p>{error}</p>
              <p>Veuillez vous inscrire à nouveau ou contacter notre support.</p>
              <Link href="/login" className={styles.link}>
                Retour à la page de connexion
              </Link>
            </div>
          </div>
        )}
        
        {success && (
          <div className={styles.success}>
            <FontAwesomeIcon icon={faCheck} className={styles.icon} />
            <h3>Email vérifié avec succès!</h3>
            <p>Votre adresse email a été vérifiée avec succès. Vous allez être automatiquement connecté et redirigé vers la page de complétion de profil.</p>
          </div>
        )}
      </div>
    </div>
  );
} 