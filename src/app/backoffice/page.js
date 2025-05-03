'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './backoffice.module.css';

export default function Backoffice() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Vérifier si l'utilisateur est admin
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:3001/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Token invalide');
      })
      .then(data => {
        if (!data.user.isAdmin) {
          router.push('/');
          throw new Error('Accès non autorisé');
        }
        return fetchData(token);
      })
      .catch(err => {
        console.error('Erreur:', err);
        setError(err.message);
        if (err.message === 'Token invalide') {
          localStorage.removeItem('token');
          router.push('/login');
        }
      })
      .finally(() => {
        setLoading(false);
      });
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchData = async (token) => {
    try {
      // Récupérer la liste des utilisateurs
      const usersResponse = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!usersResponse.ok) throw new Error('Erreur lors de la récupération des utilisateurs');
      const usersData = await usersResponse.json();
      setUsers(usersData);
      
      // Récupérer la liste des devis
      const quotesResponse = await fetch('http://localhost:3002/api/quotes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!quotesResponse.ok) throw new Error('Erreur lors de la récupération des devis');
      const quotesData = await quotesResponse.json();
      setQuotes(quotesData);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    }
  };

  const toggleUserSubscription = async (userId, isSubscribed) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/users/${userId}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isSubscribed: !isSubscribed })
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour de l\'abonnement');
      
      // Mettre à jour la liste des utilisateurs
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isSubscribed: !isSubscribed } : user
      ));
    } catch (err) {
      console.error('Erreur:', err);
      alert(err.message);
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