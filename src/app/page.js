'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/utils/api';
import Navbar from '@/components/Navbar';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debug, setDebug] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('Pas de token trouvé, redirection vers login');
          router.push('/login');
          return;
        }

        console.log('Token trouvé, vérification...');
        console.log('Token:', token.substring(0, 15) + '...');
        
        try {
          const response = await authService.verify();
          console.log('Réponse de vérification:', response.data);
          setUser(response.data.user);
          setError(null);
        } catch (initialError) {
          console.error('Erreur de vérification initiale:', initialError);
          
          // Si l'endpoint /verify échoue, essayons l'endpoint de débogage
          try {
            console.log('Tentative de vérification avec l\'endpoint de débogage...');
            const debugResponse = await authService.debugVerify();
            console.log('Réponse de débogage:', debugResponse.data);
            
            if (debugResponse.data.message === 'Token valide') {
              console.log('Token validé via debug, mais problème de connexion avec le service DB');
              setError('Votre session est valide, mais il y a un problème de connexion avec la base de données.');
            } else {
              localStorage.removeItem('token');
              router.push('/login');
            }
          } catch (debugError) {
            console.error('Échec du débogage de vérification:', debugError);
            throw initialError; // Relancer l'erreur initiale
          }
        }
      } catch (error) {
        console.error('Erreur d\'authentification:', error);
        setError(error.message || 'Erreur d\'authentification');
        
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Données:', error.response.data);
          
          // Journalisation détaillée de l'erreur
          if (error.response.status === 404) {
            console.error('Endpoint /verify non trouvé. Vérifiez la configuration du serveur.');
          } else if (error.response.status === 403) {
            console.error('Token invalide ou expiré.');
          }
        } else if (error.request) {
          console.error('Pas de réponse reçue du serveur. Vérifiez que le serveur d\'authentification est en cours d\'exécution.');
        }
        
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleGenerateQuote = () => {
    router.push('/quote');
  };

  // Ajouter cette fonction pour diagnostiquer les routes
  const handleCheckRoutes = async () => {
    try {
      setDebug("Vérification des routes disponibles...");
      const response = await authService.listRoutes();
      setDebug(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setDebug(`Erreur: ${error.message}`);
      if (error.response) {
        setDebug(prev => `${prev}\nStatus: ${error.response.status}\nDonnées: ${JSON.stringify(error.response.data)}`);
      }
    }
  };
  
  // Fonction pour tester la configuration du service d'authentification
  const handleTestAuthService = async () => {
    try {
      setDebug(`Test de la configuration du service authentification...`);
      const response = await authService.testAuthService();
      setDebug(JSON.stringify(response.data, null, 2));
    } catch (error) {
      setDebug(`Erreur: ${error.message}`);
      if (error.response) {
        setDebug(prev => `${prev}\nStatus: ${error.response.status}\nDonnées: ${JSON.stringify(error.response.data)}`);
      }
    }
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1>Erreur d&apos;authentification</h1>
          <p>{error}</p>
          <button onClick={() => router.push('/login')}>Retour à la connexion</button>
          <button onClick={handleCheckRoutes}>Vérifier routes disponibles</button>
          <button onClick={handleTestAuthService}>Tester la configuration du service d&apos;authentification</button>
          {debug && (
            <div className={styles.debug}>
              <h3>Informations de débogage:</h3>
              <pre>{debug}</pre>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar user={user} />
      
      <main className={styles.main}>
        <h1>Bienvenue sur le générateur de devis IA</h1>
        <p>Générez des devis précis pour vos projets de développement web</p>
        
        <div className={styles.actionContainer}>
          <button 
            className={styles.generateBtn}
            onClick={handleGenerateQuote}
          >
            Générer un devis
          </button>
        </div>
      </main>
    </div>
  );
}