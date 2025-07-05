'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { getUser } from '@/services/authService';
import { getQuotesForUser, downloadQuotePDF, getQuoteStats } from '@/services/quoteService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faFileDownload, 
  faCircleNotch,
  faFileInvoice,
  faEuroSign,
  faChartLine 
} from '@fortawesome/free-solid-svg-icons';
import Navbar from '@/components/Navbar';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUser();
        if (userData) {
          setUser(userData);
          const [userQuotes, userStats] = await Promise.all([
            getQuotesForUser(),
            getQuoteStats()
          ]);
          setQuotes(userQuotes);
          setStats(userStats);
        } else {
          router.push('/login');
        }
      } catch (err) {
        setError('Impossible de charger les données. Veuillez vous reconnecter.');
        console.error(err);
        // Optionnel: rediriger vers le login après un délai
        // setTimeout(() => router.push('/login'), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleDownload = async (quoteId) => {
    if (downloadingId) return; // Empêche les téléchargements multiples
    
    setDownloadingId(quoteId);
    try {
      await downloadQuotePDF(quoteId);
    } catch (err) {
      setError(`Erreur lors du téléchargement du devis ${quoteId}.`);
      console.error(err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        <p>Chargement de votre tableau de bord...</p>
      </div>
    );
  }
  
  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }
console.log("stats", stats);
  return (
    <>
      <Navbar user={user} />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Bienvenue, {user?.name || 'cher utilisateur'} !
          </h1>
          <strong className={styles.description}>
            Prêt à créer votre prochain devis ?
          </strong>
          <button onClick={() => router.push('/quote')} className={styles.generateButton}>
            Générer un nouveau devis
          </button>
        </div>
        
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <FontAwesomeIcon icon={faFileInvoice} className={styles.statIcon} />
              <div className={styles.statValue}>{stats.totalQuotes}</div>
              <div className={styles.statLabel}>Devis créés</div>
            </div>
            <div className={styles.statCard}>
              <FontAwesomeIcon icon={faEuroSign} className={styles.statIcon} />
              <div className={styles.statValue}>{stats.totalEarned.toLocaleString('fr-FR')} €</div>
              <div className={styles.statLabel}>Total gagné</div>
            </div>
            <div className={styles.statCard}>
              <FontAwesomeIcon icon={faChartLine} className={styles.statIcon} />
              <div className={styles.statValue}>{stats.monthlyAverage.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
              <div className={styles.statLabel}>Moyenne mensuelle</div>
            </div>
          </div>
        )}
        
        <div className={styles.content}>
          <div className={styles.quoteList}>
            <h2>Vos devis récents</h2>
            {quotes.length > 0 ? (
              <ul>
                {quotes.slice(0, 5).map((quote) => {
                  const date = new Date(quote.createdAt);
                  const formattedDate = `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
                  
                  return (
                    <li key={quote.id} className={styles.quoteItem}>
                      <span className={styles.quoteTitle}>{quote.title}</span>
                      <span className={styles.quoteDate}>
                        {formattedDate}
                      </span>
                      <span className={styles.quoteAction}>
                        <button 
                          onClick={() => handleDownload(quote.id)}
                          className={styles.downloadButton}
                          disabled={downloadingId === quote.id}
                          title="Télécharger le PDF"
                        >
                          {downloadingId === quote.id ? (
                            <FontAwesomeIcon icon={faCircleNotch} spin />
                          ) : (
                            <FontAwesomeIcon icon={faFileDownload} />
                          )}
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>Vous n&apos;avez pas encore de devis.</p>
            )}
          </div>
        </div>
      </main>
    </>
  );
}