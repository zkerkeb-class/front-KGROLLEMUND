'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { dbAPI } from '@/services/axiosConfig';
import Navbar from '@/components/Navbar';
import styles from './profile.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    specialty: '',
    yearsOfExperience: 0,
    hourlyRate: '',
    skills: [],
    mainLanguages: [],
    frameworks: [],
    certifications: [],
    bio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Charger les données de l'utilisateur et son profil
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Vérifier l'authentification
        const authResponse = await authService.verify();
        const userData = authResponse.data.user;
        setUser(userData);

        // Récupérer le profil développeur s'il existe
        try {
          const profileResponse = await dbAPI.get(`/developer-profiles/${userData.id}`);
          if (profileResponse.data) {
            setProfile({
              specialty: profileResponse.data.specialty || '',
              yearsOfExperience: profileResponse.data.yearsOfExperience || 0,
              hourlyRate: profileResponse.data.hourlyRate || '',
              skills: profileResponse.data.skills || [],
              mainLanguages: profileResponse.data.mainLanguages || [],
              frameworks: profileResponse.data.frameworks || [],
              certifications: profileResponse.data.certifications || [],
              bio: profileResponse.data.bio || ''
            });
          }
        } catch (profileError) {
          // Si le profil n'existe pas encore, ce n'est pas une erreur critique
          console.log('Pas de profil existant, création d\'un nouveau profil');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Mettre à jour le state pour les champs texte
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  // Mettre à jour le state pour les champs array (séparés par des virgules)
  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value.split(',').map(item => item.trim()).filter(item => item !== '')
    });
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const response = await dbAPI.post('/developer-profiles', {
        userId: user.id,
        ...profile,
        yearsOfExperience: parseInt(profile.yearsOfExperience) || 0,
        hourlyRate: profile.hourlyRate ? parseFloat(profile.hourlyRate) : null
      });

      setSuccessMessage('Votre profil a été enregistré avec succès!');
      // Rediriger vers la page d'accueil après un court délai
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du profil:', error);
      setErrorMessage('Une erreur est survenue lors de l\'enregistrement de votre profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.container}>
      <Navbar user={user} />
      
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Votre profil développeur</h1>
        <p className={styles.subtitle}>
          Complétez votre profil professionnel pour obtenir des devis plus précis
        </p>

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="specialty">Spécialité</label>
            <select
              id="specialty"
              name="specialty"
              value={profile.specialty}
              onChange={handleChange}
              required
              className={styles.select}
            >
              <option value="">Sélectionnez votre spécialité</option>
              <option value="frontend">Développeur Frontend</option>
              <option value="backend">Développeur Backend</option>
              <option value="fullstack">Développeur Fullstack</option>
              <option value="mobile">Développeur Mobile</option>
              <option value="devops">DevOps</option>
              <option value="data">Data Engineer / Scientist</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="yearsOfExperience">Années d'expérience</label>
            <input
              type="number"
              id="yearsOfExperience"
              name="yearsOfExperience"
              min="0"
              value={profile.yearsOfExperience}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="hourlyRate">Taux horaire (€)</label>
            <input
              type="number"
              id="hourlyRate"
              name="hourlyRate"
              min="0"
              value={profile.hourlyRate}
              onChange={handleChange}
              className={styles.input}
              placeholder="Optionnel"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="skills">Compétences (séparées par des virgules)</label>
            <input
              type="text"
              id="skills"
              name="skills"
              value={profile.skills.join(', ')}
              onChange={handleArrayChange}
              required
              className={styles.input}
              placeholder="React, Node.js, TypeScript..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="mainLanguages">Langages de programmation (séparés par des virgules)</label>
            <input
              type="text"
              id="mainLanguages"
              name="mainLanguages"
              value={profile.mainLanguages.join(', ')}
              onChange={handleArrayChange}
              required
              className={styles.input}
              placeholder="JavaScript, Python, Java..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="frameworks">Frameworks (séparés par des virgules)</label>
            <input
              type="text"
              id="frameworks"
              name="frameworks"
              value={profile.frameworks.join(', ')}
              onChange={handleArrayChange}
              className={styles.input}
              placeholder="React, Express, Laravel..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="certifications">Certifications (séparées par des virgules)</label>
            <input
              type="text"
              id="certifications"
              name="certifications"
              value={profile.certifications.join(', ')}
              onChange={handleArrayChange}
              className={styles.input}
              placeholder="AWS, Google Cloud, Microsoft Azure..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bio">Biographie professionnelle</label>
            <textarea
              id="bio"
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              className={styles.textarea}
              placeholder="Décrivez brièvement votre parcours et vos compétences..."
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le profil'}
          </button>
        </form>
      </div>
    </div>
  );
} 