'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verify } from '@/services/authService';
import { dbAPI } from '@/services/axiosConfig';
import { subscriptionService } from '@/services/subscriptionService';
import Navbar from '@/components/Navbar';
import { sectors, specialtiesBySector } from '@/constants/specialties';
import styles from './profile.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faTimesCircle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import ConfirmModal from '../../components/ConfirmModal';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    sector: '',
    specialties: [],
    yearsOfExperience: 0,
  });
  const [customSpecialties, setCustomSpecialties] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Charger les données de l'utilisateur et son profil
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        console.log('--- PROFIL: DÉBUT de la récupération des données ---');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('--- PROFIL: Pas de token trouvé. Redirection. ---');
          router.push('/login');
          return;
        }
        console.log('--- PROFIL: Token trouvé. Vérification en cours... ---');

        // Vérifier l'authentification
        const authResponse = await verify();
        console.log('--- PROFIL: Réponse BRUTE du service de vérification ---', authResponse);
        
        if (!authResponse || !authResponse.data || !authResponse.data.user) {
            console.error('--- PROFIL: La réponse de l\'API est INVALIDE. Redirection. ---', authResponse);
            localStorage.removeItem('token');
            router.push('/login');
            return;
        }

        const userData = authResponse.data.user;
        console.log('--- PROFIL: Données utilisateur extraites avec SUCCÈS ---', userData);
        setUser(userData);

        // Récupérer le profil développeur s'il existe
        try {
          const profileResponse = await dbAPI.get(`/professional-profiles/user/${userData.id}`);
          if (profileResponse.data) {
            const allSpecialties = profileResponse.data.specialties || [];
            const standardSpecialties = [];
            const customSpecs = {};
            
            // Séparer les spécialités standards des personnalisées
            allSpecialties.forEach(spec => {
              if (spec.includes(':')) {
                const [key, value] = spec.split(':');
                // C'est une spécialité personnalisée
                if (!standardSpecialties.includes(key)) {
                  standardSpecialties.push(key);
                }
                if (!customSpecs[key]) {
                  customSpecs[key] = [];
                }
                customSpecs[key].push(value);
              } else {
                // C'est une spécialité standard
                standardSpecialties.push(spec);
              }
            });
            
            setProfile({
              sector: profileResponse.data.sector || '',
              specialties: standardSpecialties,
              yearsOfExperience: profileResponse.data.yearsOfExperience || 0
            });
            setCustomSpecialties(customSpecs);
          }
        } catch (profileError) {
          // Si le profil n'existe pas encore, ce n'est pas une erreur critique
          console.log('Pas de profil existant, création d&apos;un nouveau profil');
        }
        console.log('LOG: User data', userData);
        
        // Déterminer le statut de l'abonnement à partir des données utilisateur existantes
        if (userData.isSubscribed && userData.subscriptionEndDate) {
          const endDate = new Date(userData.subscriptionEndDate);
          const now = new Date();
          
          setSubscriptionStatus({
            status: endDate > now ? 'active' : 'expired',
            current_period_end: userData.subscriptionEndDate // Utiliser directement la date string
          });
        } else {
            setSubscriptionStatus({ status: 'inactive' });
        }

      } catch (error) {
        console.error('--- PROFIL: ERREUR FATALE dans le bloc try/catch. Redirection. ---');
        console.error('--- PROFIL: Objet de l\'erreur:', error);
        if (error.response) {
            console.error('--- PROFIL: Données de la réponse d\'erreur:', error.response.data);
            console.error('--- PROFIL: Statut de la réponse d\'erreur:', error.response.status);
        }
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
    
    // Si on change le secteur, réinitialiser les spécialités
    if (name === 'sector') {
      setProfile({
        ...profile,
        [name]: value,
        specialties: [] // Réinitialiser les spécialités quand on change de secteur
      });
      setCustomSpecialties({}); // Réinitialiser aussi les spécialités personnalisées
    } else {
    setProfile({
      ...profile,
      [name]: value
    });
    }
  };

  // Mettre à jour le state pour les champs array (séparés par des virgules)
  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value.split(',').map(item => item.trim()).filter(item => item !== '')
    });
  };

  // Gérer les checkboxes pour les spécialités
  const handleSpecialtyCheckboxChange = (e) => {
    const { value, checked } = e.target;
    let newSpecialties;
    
    if (checked) {
      newSpecialties = [...profile.specialties, value];
      // Si on coche une spécialité "autre", initialiser avec un champ vide
      if (value.includes('autre-') && !customSpecialties[value]) {
        setCustomSpecialties({
          ...customSpecialties,
          [value]: ['']
        });
      }
    } else {
      newSpecialties = profile.specialties.filter(specialty => specialty !== value);
      // Si on décoche une spécialité "autre", supprimer aussi le texte personnalisé
      if (value.includes('autre-')) {
        const newCustomSpecialties = { ...customSpecialties };
        delete newCustomSpecialties[value];
        setCustomSpecialties(newCustomSpecialties);
      }
    }
    
    console.log('Spécialités sélectionnées:', newSpecialties);
    setProfile({
      ...profile,
      specialties: newSpecialties
    });
  };

  // Gérer les champs texte pour les spécialités "autre"
  const handleCustomSpecialtyChange = (specialtyKey, index, value) => {
    const currentSpecialties = customSpecialties[specialtyKey] || [''];
    const newSpecialties = [...currentSpecialties];
    newSpecialties[index] = value;
    
    setCustomSpecialties({
      ...customSpecialties,
      [specialtyKey]: newSpecialties
    });
  };

  // Ajouter un nouveau champ pour une spécialité "autre"
  const addCustomSpecialty = (specialtyKey) => {
    const currentSpecialties = customSpecialties[specialtyKey] || [];
    setCustomSpecialties({
      ...customSpecialties,
      [specialtyKey]: [...currentSpecialties, '']
    });
  };

  // Supprimer un champ de spécialité "autre"
  const removeCustomSpecialty = (specialtyKey, index) => {
    const currentSpecialties = customSpecialties[specialtyKey] || [];
    const newSpecialties = currentSpecialties.filter((_, i) => i !== index);
    
    if (newSpecialties.length === 0) {
      // Si plus de specialites personnalisees, supprimer la cle et decocher la case
      const newCustomSpecialties = { ...customSpecialties };
      delete newCustomSpecialties[specialtyKey];
      setCustomSpecialties(newCustomSpecialties);
      
      // Décocher aussi la case &quot;Autres spécialités&quot;
      setProfile({
        ...profile,
        specialties: profile.specialties.filter(s => s !== specialtyKey)
      });
    } else {
      setCustomSpecialties({
        ...customSpecialties,
        [specialtyKey]: newSpecialties
      });
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setError('');

    try {
      // Préparer les données avec les spécialités personnalisées
      const finalSpecialties = [];
      
      // Traiter chaque spécialité sélectionnée
      profile.specialties.forEach(specialty => {
        if (specialty.includes('autre-') && customSpecialties[specialty]) {
          // Pour les spécialités "autre", on stocke les valeurs personnalisées
          customSpecialties[specialty].forEach((value, index) => {
            if (value.trim()) {
              finalSpecialties.push(`${specialty}:${value.trim()}`);
            }
          });
        } else {
          // Pour les spécialités standards, on stocke tel quel
          finalSpecialties.push(specialty);
        }
      });

      let response;
      
      // Vérifier s'il faut créer ou mettre à jour
      try {
        // Essayer de récupérer le profil existant
        await dbAPI.get(`/professional-profiles/user/${user.id}`);
        // Si pas d'erreur, le profil existe, faire un PUT
        response = await dbAPI.put(`/professional-profiles/user/${user.id}`, {
          sector: profile.sector,
          specialties: finalSpecialties,
          yearsOfExperience: parseInt(profile.yearsOfExperience) || 0
        });
      } catch (profileError) {
        // Si erreur 404, le profil n'existe pas, faire un POST
        if (profileError.response?.status === 404) {
          response = await dbAPI.post('/professional-profiles', {
            userId: user.id,
            sector: profile.sector,
            specialties: finalSpecialties,
            yearsOfExperience: parseInt(profile.yearsOfExperience) || 0
          });
        } else {
          throw profileError;
        }
      }
      
      console.log(response.data);
      setSuccessMessage('Votre profil a été enregistré avec succès!');
      // Rediriger vers la page d'accueil après un court délai
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Erreur lors de l&apos;enregistrement du profil:', error);
      setError('Une erreur est survenue lors de l&apos;enregistrement de votre profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer le désabonnement
  const handleUnsubscribe = async () => {
    // La logique originale, qui fonctionnait
    if (!user || !user.subscriptionId) {
      setError('Impossible de trouver les informations d&apos;abonnement.');
      return;
    }
    
    // Fermer la modale et exécuter la logique
    setShowConfirmModal(false);
    setIsUnsubscribing(true);
    setError(null);
    
    try {
      await subscriptionService.cancelSubscription(user.subscriptionId);
      
      setSuccessMessage('Votre abonnement a été annulé avec succès. Il restera actif jusqu&apos;à la fin de la période en cours.');
      
      // Recharger la page pour afficher le statut mis à jour
      window.location.reload();
      
    } catch (err) {
      console.error('Erreur lors de l&apos;annulation de l&apos;abonnement:', err);
      setError(err.response?.data?.message || 'Une erreur est survenue lors de l&apos;annulation.');
    } finally {
      setIsUnsubscribing(false);
    }
  };

  const openUnsubscribeModal = () => {
    setShowConfirmModal(true);
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  // LOGS pour le rendu
  console.log('LOG: Rendering component with state:');
  console.log('LOG: user.isSubscribed ->', user?.isSubscribed);

  return (
    <div className={styles.container}>
      <Navbar user={user} />
      
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Votre profil développeur</h1>
        <p className={styles.subtitle}>
          Complétez votre profil professionnel pour obtenir des devis plus précis
        </p>

        {/* Section Abonnement */}
        {user && (
          <div className={styles.subscriptionSection}>
            <h2 className={styles.sectionTitle}>
              <FontAwesomeIcon icon={faCrown} className={styles.crownIcon} />
              Statut de l&apos;abonnement
            </h2>
            
            {user.isSubscribed ? (
              <div className={styles.subscriptionActive}>
                <div className={styles.subscriptionInfo}>
                  <FontAwesomeIcon icon={faInfoCircle} className={styles.infoIcon} />
                  <div>
                    <p><strong>Vous êtes abonné au service premium</strong></p>
                      <div className={styles.subscriptionDetails}>
                        <p>Statut: <span className={styles.status}>{subscriptionStatus.status}</span></p>
                        <p>Fin de période: <span className={styles.date}>
                          {new Date(subscriptionStatus.current_period_end).toLocaleDateString('fr-FR')}
                        </span></p>
                          <button 
                            onClick={openUnsubscribeModal} 
                            className={styles.unsubscribeButton} 
                            disabled={isUnsubscribing}
                          >
                            {isUnsubscribing ? 'Annulation...' : 'Se désabonner'}
                          </button>                        
                      </div>                   
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.subscriptionInactive}>
                <p>Vous n&apos;êtes pas abonné au service premium</p>
                <button
                  onClick={() => router.push('/subscription')}
                  className={styles.subscribeButton}
                >
                  <FontAwesomeIcon icon={faCrown} />
                  S&apos;abonner maintenant
                </button>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className={styles.successMessage}>{successMessage}</div>
        )}

        {error && (
          <div className={styles.errorMessage}>{error}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="sector">Secteur d&apos;activité</label>
            <select
              id="sector"
              name="sector"
              value={profile.sector}
              onChange={handleChange}
              required
              className={styles.select}
            >
              <option value="">Sélectionnez votre secteur</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Spécialités</label>
            {!profile.sector ? (
              <div className={styles.disabledCheckboxGroup}>
                <p className={styles.disabledText}>Veuillez d&apos;abord sélectionner un secteur d&apos;activité</p>
              </div>
            ) : (
              <div className={styles.checkboxGroup}>
                {specialtiesBySector[profile.sector]?.map((specialty) => (
                  <div key={specialty.value}>
                    <label className={styles.checkboxItem}>
                      <input
                        type="checkbox"
                        value={specialty.value}
                        checked={profile.specialties.includes(specialty.value)}
                        onChange={handleSpecialtyCheckboxChange}
                        className={styles.checkbox}
                      />
                      <span className={styles.checkboxLabel}>{specialty.label}</span>
                    </label>
                    {specialty.value.includes('autre-') && profile.specialties.includes(specialty.value) && (
                      <div className={styles.customSpecialtyContainer}>
                        {(customSpecialties[specialty.value] || ['']).map((value, index) => (
                          <div key={index} className={styles.customSpecialtyRow}>
                            <input
                              type="text"
                              placeholder={`Spécialité ${index + 1}`}
                              value={value}
                              onChange={(e) => handleCustomSpecialtyChange(specialty.value, index, e.target.value)}
                              className={styles.customSpecialtyInput}
                            />
                            <button
                              type="button"
                              onClick={() => removeCustomSpecialty(specialty.value, index)}
                              className={styles.removeButton}
                              title="Supprimer cette specialite"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addCustomSpecialty(specialty.value)}
                          className={styles.addButton}
                        >
                          + Ajouter une spécialité
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <small className={styles.helpText}>
              {profile.specialties.length > 0 && (
                <span className={styles.selectedCount}>
                  {profile.specialties.length} spécialité(s) sélectionnée(s)
                </span>
              )}
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="yearsOfExperience">Années d&apos;expérience</label>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer le profil'}
          </button>
        </form>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleUnsubscribe}
        title="Confirmation d'annulation"
      >
        <p>Êtes-vous sûr de vouloir vous désabonner ?</p>
        <p>Vous perdrez l&apos;accès aux fonctionnalités premium à la fin de votre période de facturation en cours.</p>
      </ConfirmModal>
    </div>
  );
} 