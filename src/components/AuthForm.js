'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/utils/api';
import styles from '../styles/AuthForm.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faLinkedin, faGithub } from '@fortawesome/free-brands-svg-icons';
import { faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

export default function AuthForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthCleanupInProgress, setOauthCleanupInProgress] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  // Vérifier si un nettoyage OAuth est en cours
  useEffect(() => {
    // Cette vérification n'est plus nécessaire avec notre nouvelle approche
    setOauthCleanupInProgress(false);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-formatage du numéro de téléphone
    if (name === 'phoneNumber') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formattedPhone }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  // Fonction pour formater automatiquement le numéro de téléphone
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    
    // Supprimer tous les espaces, tirets, points, parenthèses
    let cleaned = phone.replace(/[\s\-\.\(\)]/g, '');
    
    // Si ça commence déjà par +, garder tel quel
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Si ça commence par 0 (numéro français), remplacer par +33
    if (cleaned.startsWith('0')) {
      return '+33' + cleaned.substring(1);
    }
    
    // Si ça commence par 33 (sans le +), ajouter le +
    if (cleaned.startsWith('33')) {
      return '+' + cleaned;
    }
    
    // Si c'est un numéro à 10 chiffres qui commence par 6 ou 7 (mobile français)
    if (cleaned.length === 10 && (cleaned.startsWith('6') || cleaned.startsWith('7'))) {
      return '+33' + cleaned;
    }
    
    // Pour les autres cas, laisser tel quel (l'utilisateur saisit un numéro international)
    return cleaned;
  };

  const handleOAuthLogin = (provider) => {
    // Ne plus bloquer les connexions OAuth
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

  const validateForm = () => {
    if (!formData.email) {
      setError("L'email est requis");
      return false;
    }
    
    if (!isLogin && !formData.name) {
      setError('Le nom est requis');
      return false;
    }
    
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return false;
    }
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    if (!isLogin && formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Connexion
        console.log('Tentative de connexion avec:', { email: formData.email });
        const response = await authService.login(formData.email, formData.password);
        console.log('Réponse de connexion:', response);
        
        if (response.token) {
          console.log('Token reçu, stockage dans localStorage et cookies');
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
           
          // Définir un cookie pour indiquer si le profil est complété
          document.cookie = `isProfileCompleted=${response.user.isProfileCompleted ? 'true' : 'false'}; path=/; max-age=86400`;
          // Définir un cookie pour le token également
          document.cookie = `token=${response.token}; path=/; max-age=86400`;
           
          // Si le profil n'est pas complété, rediriger vers la page de complétion
          if (!response.user.isProfileCompleted) {
            console.log('Profil non complété, redirection vers /complete-profile');
            router.push('/complete-profile');
          } else {
            console.log('Profil déjà complété, redirection vers /');
            // Utiliser window.location.href pour une redirection plus forte
            window.location.href = '/';
          }
        } else {
          console.error('Pas de token dans la réponse:', response);
          setError('Erreur lors de la connexion: pas de token reçu');
        }
      } else {
        // Inscription simple sans données de profil
        const response = await authService.register(
          formData.name, 
          formData.email, 
          formData.password,
          formData.phoneNumber
        );
        
        if (response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
           
          // Définir un cookie pour indiquer si le profil est complété
          // Pour une nouvelle inscription, le profil n'est pas complété
          document.cookie = `isProfileCompleted=false; path=/; max-age=86400`;
          
          setSuccess('Votre compte a été créé avec succès! Veuillez vérifier votre email pour activer votre compte.');
          setTimeout(() => {
            router.push('/complete-profile');
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Erreur d\'authentification:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'authentification');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.authForm}>
      <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
      
      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="name">Nom</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Votre nom"
            />
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Votre email"
          />
        </div>
        
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="phoneNumber">Numéro de téléphone</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Ex: 0612345678 (sera formaté en +33612345678)"
            />
            <small style={{ color: '#666', fontSize: '0.8em' }}>
              Les numéros français sont automatiquement formatés au format international (+33)
            </small>
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label htmlFor="password">Mot de passe</label>
          <div className={styles.passwordInput}>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Votre mot de passe"
            />
            <button 
              type="button" 
              className={styles.togglePassword}
              onClick={togglePasswordVisibility}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>
        
        {!isLogin && (
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <div className={styles.passwordInput}>
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirmez votre mot de passe"
              />
            </div>
          </div>
        )}
        
        <button 
          type="submit" 
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? (
            <><FontAwesomeIcon icon={faSpinner} spin /> {isLogin ? 'Connexion...' : 'Inscription...'}</>
          ) : (
            isLogin ? 'Se connecter' : 'S\'inscrire'
          )}
        </button>
        
        {isLogin && (
          <div className={styles.forgotPassword}>
            <Link href="/reset-password" className={styles.forgotBtn}>
              Mot de passe oublié ?
            </Link>
          </div>
        )}
      </form>
      
      <div className={styles.separator}>
        <span>OU</span>
      </div>
      
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
      
      <div className={styles.formToggle}>
        <button 
          type="button" 
          className={styles.toggleBtn}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Créer un compte' : 'Déjà inscrit ? Se connecter'}
        </button>
      </div>
    </div>
  );
} 