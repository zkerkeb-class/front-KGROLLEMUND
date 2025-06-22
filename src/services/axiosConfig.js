import axios from 'axios';

// Création d'instances axios pour chaque service
export const authAPI = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const iaAPI = axios.create({
  baseURL: 'http://localhost:3005/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const notificationAPI = axios.create({
  baseURL: 'http://localhost:3003/notifications',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const dbAPI = axios.create({
  baseURL: 'http://localhost:3004',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const paymentAPI = axios.create({
  baseURL: 'http://localhost:3002/api/payments',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fonction pour récupérer un cookie par son nom
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Intercepteur pour ajouter le token d'authentification
const addAuthToken = (config) => {
  // Essayer d'abord de récupérer le token depuis localStorage
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Si pas de token dans localStorage, essayer dans les cookies
  if (!token && typeof document !== 'undefined') {
    token = getCookie('token');
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Intercepteur pour gérer les erreurs
const handleError = (error) => {
  console.error('Axios error:', error);
  return Promise.reject(error);
};

// Appliquer les intercepteurs à toutes les instances
[authAPI, iaAPI, notificationAPI, dbAPI, paymentAPI].forEach(instance => {
  instance.interceptors.request.use(addAuthToken);
  instance.interceptors.response.use(response => response, handleError);
}); 