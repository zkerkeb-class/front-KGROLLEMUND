'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/utils/api';
import styles from './reset-password.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faSpinner, faCheck, faExclamationTriangle, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [resetCode, setResetCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('request-reset');
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await authService.requestPasswordResetByEmail({
        email: email
      });
      
      setStep('enter-code');
      setSuccess(false);
    } catch (err) {
      console.error('Erreur lors de la demande de réinitialisation:', err);
      setError(err.message || 'Une erreur est survenue lors de la demande de réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!resetCode) {
      setError('Veuillez entrer le code de réinitialisation.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authService.verifyResetCode(email, resetCode);
      
      // Stocker le token temporaire et l'ID utilisateur
      setTempToken(response.tempToken);
      setUserId(response.userId);
      
      // Passer à l'étape de saisie du nouveau mot de passe
      setStep('enter-password');
    } catch (err) {
      console.error('Erreur lors de la vérification du code:', err);
      setError(err.message || 'Code de réinitialisation invalide ou expiré.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (tempToken && userId) {
        // Méthode par email (code)
        await authService.resetPasswordWithCode(tempToken, userId, password);
      } else {
        throw new Error('Informations de réinitialisation manquantes.');
      }
      
      setSuccess(true);
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', err);
      setError(err.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.success}>
            <FontAwesomeIcon icon={faCheck} className={styles.icon} />
            <h2>Mot de passe réinitialisé</h2>
            <p>Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.</p>
            <Link href="/login" className={styles.link}>
              Aller à la page de connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Réinitialisation du mot de passe</h2>
        
        {error && (
          <div className={styles.error}>
            <FontAwesomeIcon icon={faExclamationTriangle} className={styles.icon} />
            {error}
          </div>
        )}
        
        {step === 'request-reset' && (
          <form onSubmit={handleRequestReset}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Adresse email</label>
              <div className={styles.inputWithIcon}>
                <FontAwesomeIcon icon={faEnvelope} className={styles.inputIcon} />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> Envoi en cours...</>
              ) : (
                'Envoyer un code de réinitialisation'
              )}
            </button>
            
            <div className={styles.backToLogin}>
              <Link href="/login" className={styles.link}>
                Retour à la page de connexion
              </Link>
            </div>
          </form>
        )}
        
        {step === 'enter-code' && (
          <form onSubmit={handleVerifyCode}>
            <div className={styles.formGroup}>
              <label htmlFor="resetCode">Code de réinitialisation</label>
              <input
                type="text"
                id="resetCode"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Entrez le code reçu par email"
                required
              />
              <small>Le code a été envoyé à l&apos;adresse {email}</small>
            </div>
            
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> Vérification en cours...</>
              ) : (
                'Vérifier le code'
              )}
            </button>
            
            <div className={styles.backToLogin}>
              <button 
                type="button"
                className={styles.link}
                onClick={() => setStep('request-reset')}
              >
                Retour
              </button>
            </div>
          </form>
        )}
        
        {step === 'enter-password' && (
          <form onSubmit={handleResetPassword}>
            <div className={styles.formGroup}>
              <label htmlFor="password">Nouveau mot de passe</label>
              <div className={styles.passwordInput}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre nouveau mot de passe"
                  required
                />
                <button 
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={styles.togglePassword}
                >
                  <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmez votre nouveau mot de passe"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <><FontAwesomeIcon icon={faSpinner} spin /> Réinitialisation en cours...</>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
            
            <div className={styles.backToLogin}>
              <button 
                type="button"
                className={styles.link}
                onClick={() => setStep('enter-code')}
              >
                Retour
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 