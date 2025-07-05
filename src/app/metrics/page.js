'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/services/authService';
import styles from './metrics.module.css';
import Navbar from '@/components/Navbar';

export default function MetricsDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuthAndFetchMetrics = async () => {
      try {
        const userData = await getUser();
        if (userData) {
          setUser(userData);
          setAuthLoading(false);
          await fetchMetrics();
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Erreur d\'authentification:', err);
        router.push('/login');
      }
    };

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await fetch(process.env.NEXT_PUBLIC_METRICS_URL);
        
        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération des métriques: ${response.status}`);
        }
        
        const text = await response.text();
        setMetrics(parsePrometheusMetrics(text));
      } catch (error) {
        console.error("Erreur de fetch:", error);
        setError(`Impossible de charger les métriques. L'endpoint est-il correct ?`);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, [router]);

  // Fonction pour parser les métriques Prometheus
  const parsePrometheusMetrics = (rawData) => {
    const lines = rawData.split('\n');
    const metrics = {};
    let currentMetric = null;

    lines.forEach(line => {
      // Ignorer les lignes vides et les commentaires
      if (!line || line.startsWith('#')) return;

      // Nouvelle métrique
      if (!line.startsWith(' ')) {
        const parts = line.split(' ');
        const name = parts[0];
        const value = parseFloat(parts[1]);
        
        if (!metrics[name]) {
          metrics[name] = [];
        }
        
        metrics[name].push({
          value,
          labels: {},
          timestamp: Date.now()
        });
        
        currentMetric = name;
      }
    });

    return metrics;
  };

  // Regrouper les métriques par catégorie
  const groupMetricsByCategory = () => {
    if (!metrics) return {};
    
    const categories = {
      'http': [],
      'process': [],
      'nodejs': [],
      'custom': []
    };
    
    Object.keys(metrics).forEach(key => {
      if (key.startsWith('http_')) {
        categories.http.push(key);
      } else if (key.startsWith('process_')) {
        categories.process.push(key);
      } else if (key.startsWith('nodejs_')) {
        categories.nodejs.push(key);
      } else {
        categories.custom.push(key);
      }
    });
    
    return categories;
  };

  const formatMetricName = (name) => {
    return name
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const categories = groupMetricsByCategory();

  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Vérification de l'authentification...</div>
      </div>
    );
  }

  return (
    <>
    <Navbar user={user} />

    <div className={styles.container}>
      <h1>Métriques de l&apos;application</h1>
      
      <div className={styles.refreshInfo}>
        <p>Les données sont automatiquement rafraîchies toutes les 30 secondes.</p>
        <p>Dernière mise à jour: {new Date().toLocaleTimeString()}</p>
      </div>
      
      {loading && <div className={styles.loading}>Rafraîchissement des métriques...</div>}
      
      {error && (
        <div className={styles.error}>
          <p>Erreur lors du chargement des métriques:</p>
          <p>{error}</p>
        </div>
      )}

      {Object.keys(categories).map(category => (
        <div key={category} className={styles.category}>
          <h2>{category.charAt(0).toUpperCase() + category.slice(1)}</h2>
          {categories[category].length > 0 ? (
            <div className={styles.metricsGrid}>
              {categories[category].map(metricName => (
                <div key={metricName} className={styles.metricCard}>
                  <h3>{formatMetricName(metricName)}</h3>
                  <div className={styles.metricValue}>
                    {metrics[metricName][0]?.value.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Aucune métrique disponible dans cette catégorie.</p>
          )}
        </div>
      ))}
      
      <div className={styles.buttonContainer}>
        <a href={process.env.NEXT_PUBLIC_GRAFANA_URL} target="_blank" rel="noopener noreferrer">
          <button className={styles.button}>Voir sur Grafana</button>
        </a>
      </div>
    </div>
    </>
  );
} 