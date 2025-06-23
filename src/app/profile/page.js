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
  const [errorMessage, setErrorMessage] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);



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
        const authResponse = await verify();
        const userData = authResponse.data.user;
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

        // Récupérer le statut de l'abonnement si l'utilisateur est abonné
        if (userData.isSubscribed && userData.subscriptionId) {
          try {
            const subscriptionResponse = await subscriptionService.checkSubscriptionStatus(userData.subscriptionId);
            setSubscriptionStatus(subscriptionResponse);
          } catch (subscriptionError) {
            console.error('Erreur lors de la récupération du statut d&apos;abonnement:', subscriptionError);
          }
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
    setErrorMessage('');

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
      setErrorMessage('Une erreur est survenue lors de l&apos;enregistrement de votre profil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer le désabonnement
  const handleUnsubscribe = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vous désabonner ? Vous perdrez l&apos;accès aux fonctionnalités premium.')) {
      return;
    }

    setIsUnsubscribing(true);
    setErrorMessage('');

    try {
      await subscriptionService.cancelSubscription(user.subscriptionId);
      setSuccessMessage('Votre abonnement a été annulé avec succès. Il restera actif jusqu&apos;à la fin de la période en cours.');
      
      // Mettre à jour l'utilisateur localement
      setUser({
        ...user,
        isSubscribed: false
      });
      
      // Recharger les données pour avoir les informations à jour
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error);
      setErrorMessage('Une erreur est survenue lors du désabonnement. Veuillez réessayer.');
    } finally {
      setIsUnsubscribing(false);
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
                    {subscriptionStatus && (
                      <div className={styles.subscriptionDetails}>
                        <p>Statut: <span className={styles.status}>{subscriptionStatus.status}</span></p>
                        <p>Fin de période: <span className={styles.date}>
                          {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString('fr-FR')}
                        </span></p>
                        {subscriptionStatus.cancelAtPeriodEnd && (
                          <p className={styles.warning}>
                            ⚠️ Votre abonnement sera annulé à la fin de la période
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {!subscriptionStatus?.cancelAtPeriodEnd && (
                  <button
                    onClick={handleUnsubscribe}
                    disabled={isUnsubscribing}
                    className={styles.unsubscribeButton}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} />
                    {isUnsubscribing ? 'Annulation...' : 'Se désabonner'}
                  </button>
                )}
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

        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="sector">Secteur d'activité</label>
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
                <p className={styles.disabledText}>Veuillez d'abord sélectionner un secteur d'activité</p>
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