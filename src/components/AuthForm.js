'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/utils/api';
import styles from '../styles/AuthForm.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';

export default function AuthForm() {
  const router = useRouter();
  const [error, setError] = useState('');

  const handleOAuthLogin = (provider) => {
    let authUrl;
    
    switch (provider) {
      case 'google':
        authUrl = authService.getGoogleAuthUrl();
        break;
      case 'linkedin':
        authUrl = authService.getLinkedInAuthUrl();
        break;
      case 'github':
        authUrl = authService.getGithubAuthUrl();
        break;
      default:
        return;
    }
    
    console.log(`Redirection vers l'URL d'authentification ${provider}:`, authUrl);
    
    // Rediriger vers l'URL d'authentification OAuth
    window.location.href = authUrl;
  };

  return (
    <div className={styles.authForm}>
      <h2>Authentification</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.oauthButtons}>
        <p>Connectez-vous avec :</p>
        <div className={styles.oauthContainer}>
          <button 
            type="button" 
            className={`${styles.oauthBtn} ${styles.googleBtn}`}
            onClick={() => handleOAuthLogin('google')}
          >
            <FontAwesomeIcon icon={faGoogle} className={styles.icon} />
            <span>Google</span>
          </button>
          <button 
            type="button" 
            className={`${styles.oauthBtn} ${styles.linkedinBtn}`}
            onClick={() => handleOAuthLogin('linkedin')}
          >
            <FontAwesomeIcon icon={faLinkedin} className={styles.icon} />
            <span>LinkedIn</span>
          </button>
          <button 
            type="button" 
            className={`${styles.oauthBtn} ${styles.githubBtn}`}
            onClick={() => handleOAuthLogin('github')}
          >
            <FontAwesomeIcon icon={faGithub} className={styles.icon} />
            <span>GitHub</span>
          </button>
        </div>
      </div>
    </div>
  );
} 