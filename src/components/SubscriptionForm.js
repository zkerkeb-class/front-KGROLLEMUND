'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/Subscription.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCrown, faCheck, faTimes, faStar, faExclamationTriangle, faArrowLeft, faHome } from '@fortawesome/free-solid-svg-icons';
import { getUser } from '../services/authService';
import { getPlans, createSubscription } from '../services/paymentService';
import Navbar from './Navbar';

export default function SubscriptionPage() {
  const [plans, setPlans] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stripeError, setStripeError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Chargement des données utilisateur et plans...');
        
        // Vérifier si l'utilisateur est connecté
        const userData = await getUser();
        console.log('Données utilisateur récupérées:', userData);
        setUser(userData);
        
        // Si l'utilisateur est déjà abonné, rediriger vers la page de gestion d'abonnement
        if (userData.isSubscribed) {
          router.push('/subscription/manage');
          return;
        }
        
        // Récupérer les plans disponibles depuis l'API
        try {
          const plansData = await getPlans();
          console.log('Plans récupérés:', plansData);
          
          if (!plansData || plansData.length === 0) {
            setStripeError(true);
            setError('Aucun plan d\'abonnement n\'est disponible actuellement.');
            setLoading(false);
            return;
          }
          
          console.log('Plans bruts récupérés:', plansData);
          
          // Filtrer pour n'avoir qu'un seul plan de chaque type (mensuel et annuel)
          // On utilise un objet pour stocker un seul plan par interval (mensuel/annuel)
          const uniquePlans = {};
          
          // Parcourir tous les plans et ne garder qu'un seul par type d'interval
          plansData.forEach(plan => {
            // Si c'est le premier plan de cet interval qu'on rencontre, on le garde
            if (!uniquePlans[plan.interval]) {
              uniquePlans[plan.interval] = plan;
            }
          });
          
          // Convertir l'objet en tableau
          const filteredPlans = Object.values(uniquePlans);
          console.log('Plans filtrés (un par interval):', filteredPlans);
          
          if (filteredPlans.length === 0) {
            setStripeError(true);
            setError('Aucun plan d\'abonnement valide n\'est disponible.');
            setLoading(false);
            return;
          }
          
          // Filtrer et organiser les plans (mensuel et annuel)
          const formattedPlans = filteredPlans.map(plan => {
            const isYearly = plan.interval === 'year';
            const monthlyEquivalent = isYearly ? (plan.amount / 10).toFixed(2) : plan.amount;
            
            return {
              ...plan,
              monthlyEquivalent,
              popular: isYearly, // Marquer le plan annuel comme populaire
              savings: isYearly ? '2 mois offerts' : null,
              features: [
                'Accès illimité aux devis',
                'Assistance prioritaire',
                'Pas de publicités',
                isYearly ? 'Économie de 16.7%' : null,
                isYearly ? '2 mois gratuits' : null
              ].filter(Boolean)
            };
          });
          
          // Trier pour que le plan annuel apparaisse en premier (comme recommandé)
          const sortedPlans = formattedPlans.sort((a, b) => {
            if (a.interval === 'year') return -1;
            if (b.interval === 'year') return 1;
            return 0;
          });
          
          setPlans(sortedPlans);
        } catch (planError) {
          console.error('Erreur lors de la récupération des plans:', planError);
          
          if (planError.response && planError.response.status === 500) {
            setStripeError(true);
            setError(
              'Le service de paiement n\'est pas correctement configuré. ' +
              'Veuillez contacter l\'administrateur pour configurer Stripe.'
            );
          } else {
            setError('Impossible de récupérer les plans d\'abonnement. Veuillez réessayer plus tard.');
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleSubscribe = async (planId, planInterval) => {
    try {
      // Créer une session de paiement
      const sessionData = {
        planType: planInterval === 'month' ? 'MONTHLY' : 'YEARLY',
        email: user.email,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`
      };
      
      console.log('Création de la session de paiement avec:', sessionData);
      
      try {
        const session = await createSubscription(sessionData);
        
        // Rediriger vers la page de paiement Stripe
        window.location.href = session.url;
      } catch (subscriptionError) {
        console.error('Erreur lors de la création de la session:', subscriptionError);
        
        if (subscriptionError.response && subscriptionError.response.status === 500) {
          setStripeError(true);
          setError(
            'Le service de paiement n\'est pas correctement configuré. ' +
            'Veuillez contacter l\'administrateur pour configurer Stripe.'
          );
        } else {
          setError('Le service de paiement est temporairement indisponible. Veuillez réessayer plus tard.');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la souscription:', err);
      setError(err.message);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Chargement des offres d&apos;abonnement...</div>;
  }

  if (stripeError) {
    return (
      <>
        {user && <Navbar user={user} />}
        <div className={styles.pageContainer}>
          <button className={styles.backButton} onClick={handleGoHome}>
            <FontAwesomeIcon icon={faHome} /> Accueil
          </button>
          
        </div> 
      </>
    );
  }

  if (error) {
    return (
      <>
        {user && <Navbar user={user} />}
        <div className={styles.pageContainer}>
          <button className={styles.backButton} onClick={handleGoHome}>
            <FontAwesomeIcon icon={faArrowLeft} /> Retour
          </button>
          
          <div className={styles.errorContainer}>
            <h2>Une erreur est survenue</h2>
            <p>{error}</p>
            <button onClick={() => router.push('/')}>Retour à l&apos;accueil</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {user && <Navbar user={user} />}
      <div className={styles.pageContainer}>
        <button className={styles.backButton} onClick={handleGoHome}>
          <FontAwesomeIcon icon={faArrowLeft} /> Retour
        </button>
        
        <div className={styles.subscriptionPage}>
          <div className={styles.header}>
            <FontAwesomeIcon icon={faCrown} className={styles.crownIcon} />
            <h1>Abonnez-vous à notre service Premium</h1>
            <p>Choisissez l&apos;offre qui vous convient le mieux</p>
          </div>
          
          <div className={styles.plansContainer}>
            {plans.length > 0 ? (
              plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`${styles.planCard} ${plan.popular ? styles.popularPlan : ''}`}
                >
                  {plan.popular && (
                    <div className={styles.popularBadge}>
                      <FontAwesomeIcon icon={faStar} />
                      <span>Recommandé</span>
                    </div>
                  )}
                  
                  <div className={styles.planHeader}>
                    <h2>{plan.name}</h2>
                    <p className={styles.planDescription}>{plan.description}</p>
                  </div>
                  
                  <div className={styles.planPrice}>
                    <span className={styles.amount}>{plan.amount}</span>
                    <span className={styles.currency}>{plan.currency.toUpperCase()}</span>
                    <span className={styles.interval}>
                      / {plan.interval === 'month' ? 'mois' : 'an'}
                    </span>
                  </div>
                  
                  {plan.interval === 'year' && (
                    <div className={styles.monthlyCost}>
                      <span>Soit {plan.monthlyEquivalent}€/mois</span>
                    </div>
                  )}
                  
                  {plan.savings && (
                    <div className={styles.savingsBadge}>
                      {plan.savings}
                    </div>
                  )}
                  
                  <ul className={styles.features}>
                    {plan.features.map((feature, index) => (
                      <li key={index} className={feature.includes('mois gratuits') ? styles.highlight : ''}>
                        <FontAwesomeIcon icon={faCheck} className={styles.checkIcon} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <button 
                    className={`${styles.subscribeButton} ${plan.popular ? styles.primaryButton : ''}`}
                    onClick={() => handleSubscribe(plan.id, plan.interval)}
                  >
                    {plan.popular ? 'Profiter de l\'offre' : 'S\'abonner'}
                  </button>
                </div>
              ))
            ) : (
              <div className={styles.noPlans}>
                <p>Aucun plan d&apos;abonnement disponible pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 