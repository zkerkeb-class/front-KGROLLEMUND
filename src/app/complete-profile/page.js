'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './complete-profile.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { completeProfile } from '@/services/profileService';

// Données des secteurs et spécialités (identiques à celles de AuthForm.js)
const sectors = [
  { id: 'development', name: 'Développement' },
  { id: 'design', name: 'Design' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'consulting', name: 'Consulting' },
  { id: 'projectManagement', name: 'Gestion de projet' },
];

const specialtiesBySector = {
  development: [
    { id: 'frontend', name: 'Développement Frontend' },
    { id: 'backend', name: 'Développement Backend' },
    { id: 'fullstack', name: 'Développement Fullstack' },
    { id: 'mobile', name: 'Développement Mobile' },
    { id: 'devops', name: 'DevOps' },
    { id: 'qa', name: 'Assurance Qualité' },
  ],
  design: [
    { id: 'ui', name: 'UI Design' },
    { id: 'ux', name: 'UX Design' },
    { id: 'graphic', name: 'Design Graphique' },
    { id: 'webDesign', name: 'Web Design' },
  ],
  marketing: [
    { id: 'digitalMarketing', name: 'Marketing Digital' },
    { id: 'contentMarketing', name: 'Marketing de Contenu' },
    { id: 'seo', name: 'SEO' },
    { id: 'socialMedia', name: 'Réseaux Sociaux' },
  ],
  consulting: [
    { id: 'businessConsulting', name: 'Conseil en Affaires' },
    { id: 'techConsulting', name: 'Conseil Technique' },
    { id: 'strategyConsulting', name: 'Conseil en Stratégie' },
  ],
  projectManagement: [
    { id: 'agile', name: 'Gestion Agile' },
    { id: 'traditional', name: 'Gestion Traditionnelle' },
    { id: 'productManagement', name: 'Gestion de Produit' },
  ],
};

export default function CompleteProfile() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableSpecialties, setAvailableSpecialties] = useState([]);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    sector: '',
    specialties: [],
    yearsOfExperience: ''
  });

  // Vérifier si l'utilisateur est connecté et récupérer ses informations
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
          router.push('/login');
          return;
        }
        
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Si le profil est déjà complété, rediriger vers la page d'accueil
        if (parsedUser.isProfileCompleted) {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);
  
  // Mettre à jour les spécialités disponibles lorsque le secteur change
  useEffect(() => {
    if (formData.sector) {
      setAvailableSpecialties(specialtiesBySector[formData.sector] || []);
      setFormData(prev => ({ ...prev, specialties: [] }));
    }
  }, [formData.sector]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };
  
  const handleSpecialtyChange = (e) => {
    const value = e.target.value;
    const isChecked = e.target.checked;
    
    setFormData(prev => {
      const currentSpecialties = [...prev.specialties];
      
      if (isChecked && !currentSpecialties.includes(value)) {
        currentSpecialties.push(value);
      } else if (!isChecked && currentSpecialties.includes(value)) {
        const index = currentSpecialties.indexOf(value);
        currentSpecialties.splice(index, 1);
      }
      
      return { ...prev, specialties: currentSpecialties };
    });
  };

  const validateForm = () => {
    if (!formData.sector) {
      setError('Le secteur d\'activité est requis');
      return false;
    }
    
    if (formData.specialties.length === 0) {
      setError('Veuillez sélectionner au moins une spécialité');
      return false;
    }
    
    if (!formData.yearsOfExperience) {
      setError('Les années d\'expérience sont requises');
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
      // Utiliser le service profileService pour compléter le profil
      await completeProfile({
        sector: formData.sector,
        specialties: formData.specialties,
        yearsOfExperience: parseInt(formData.yearsOfExperience)
      });
      
      // Mettre à jour les informations utilisateur dans le localStorage
      const userData = JSON.parse(localStorage.getItem('user'));
      userData.isProfileCompleted = true;
      userData.sector = formData.sector;
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Récupérer le token actuel (depuis localStorage ou cookie)
      const getTokenFromCookie = () => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; token=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
      };
      
      let token = localStorage.getItem('token') || getTokenFromCookie();
      
      // S'assurer que le token est stocké à la fois dans localStorage et cookie
      if (token) {
        localStorage.setItem('token', token);
        document.cookie = `token=${token}; path=/; max-age=86400`;
      }
      
      // Définir un cookie pour indiquer que le profil est complété
      document.cookie = `isProfileCompleted=true; path=/; max-age=86400`;
      
      setSuccess('Votre profil a été complété avec succès!');
      
      // Rediriger vers la page d'accueil après 2 secondes
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (err) {
      console.error('Erreur lors de la complétion du profil:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de la création du profil');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className={styles.completeProfileContainer}>
      <div className={styles.formContainer}>
        <h1>Complétez votre profil</h1>
        <p className={styles.welcomeText}>
          Bienvenue {user.name}! Pour continuer, veuillez compléter votre profil professionnel.
        </p>
        
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="sector">Secteur d'activité</label>
            <select
              id="sector"
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              className={styles.selectInput}
              required
            >
              <option value="">Sélectionnez un secteur</option>
              {sectors.map(sector => (
                <option key={sector.id} value={sector.id}>{sector.name}</option>
              ))}
            </select>
          </div>
          
          {formData.sector && (
            <div className={styles.formGroup}>
              <label>Spécialités</label>
              <div className={styles.checkboxGroup}>
                {availableSpecialties.map(specialty => (
                  <div key={specialty.id} className={styles.checkboxItem}>
                    <input
                      type="checkbox"
                      id={`specialty-${specialty.id}`}
                      name="specialties"
                      value={specialty.id}
                      checked={formData.specialties.includes(specialty.id)}
                      onChange={handleSpecialtyChange}
                    />
                    <label htmlFor={`specialty-${specialty.id}`}>{specialty.name}</label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label htmlFor="yearsOfExperience">Années d'expérience</label>
            <input
              type="number"
              id="yearsOfExperience"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              min="0"
              max="50"
              placeholder="Nombre d'années d'expérience"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitBtn}
            disabled={isLoading}
          >
            {isLoading ? (
              <><FontAwesomeIcon icon={faSpinner} spin /> Enregistrement...</>
            ) : (
              'Compléter mon profil'
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 