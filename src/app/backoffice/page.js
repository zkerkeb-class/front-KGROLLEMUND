'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, dbAPI, paymentAPI } from '@/services/axiosConfig';
// import styles from './backoffice.module.css';

export default function Backoffice() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await authAPI.get('/auth/verify');
        if (data.user) {
          setUser(data.user);
        } else {
          setError('Utilisateur non trouvé');
        }
      } catch (err) {
        setError('Accès non autorisé');
        console.error(err);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    // Vérifier si l'utilisateur est admin
    const token = localStorage.getItem('token');
    if (token) {
      fetchData(token);
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchData = async (token) => {
    try {
      setLoading(true);
      // Utiliser les instances Axios pour les requêtes
      const [usersResponse, quotesResponse] = await Promise.all([
        dbAPI.get('/users'),
        paymentAPI.get('/quotes')
      ]);
      
      setUsers(usersResponse.data);
      setQuotes(quotesResponse.data);
      setError('');
    } catch (err) {
      setError('Erreur lors de la récupération des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSubscription = async (userId, isSubscribed) => {
    try {
      const { data } = await dbAPI.post(`/users/${userId}/subscription`, { isSubscribed: !isSubscribed });
      setUsers(users.map(u => (u.id === userId ? data : u)));
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'abonnement', err);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className={styles.container}>
      <h1>Administration</h1>
      
      <section className={styles.section}>
        <h2>Utilisateurs</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Abonné</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.isSubscribed ? 'Oui' : 'Non'}</td>
                <td>
                  <button 
                    onClick={() => toggleUserSubscription(user.id, user.isSubscribed)}
                    className={styles.actionBtn}
                  >
                    {user.isSubscribed ? 'Désabonner' : 'Abonner'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      <section className={styles.section}>
        <h2>Devis générés</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Utilisateur</th>
              <th>Date</th>
              <th>Montant</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(quote => (
              <tr key={quote.id}>
                <td>{quote.id}</td>
                <td>{quote.userName}</td>
                <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                <td>
                  {quote.totalPrice 
                    ? `${quote.totalPrice}€` 
                    : `${quote.totalPriceRange.min}€ - ${quote.totalPriceRange.max}€`}
                </td>
                <td>
                  <button 
                    onClick={() => router.push(`/quote/${quote.id}`)}
                    className={styles.actionBtn}
                  >
                    Voir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
} 