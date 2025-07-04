import axios from 'axios';

// Création d'instances axios pour chaque service
export const authAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/auth`,
  headers: { 'Content-Type': 'application/json' },
});

export const iaAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_IA_API_URL}`,
  headers: { 'Content-Type': 'application/json' },
});

export const notificationAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NOTIFICATION_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const dbAPI = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_DB_API_URL}/api`,
});

export const paymentAPI = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PAYMENT_API_URL,
});

// Intercepteur pour ajouter le token aux requêtes
const addAuthTokenInterceptor = (config) => {
  if (typeof window !== 'undefined') {
    // La méthode via les cookies est la plus fiable suite à nos corrections
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

// Appliquer l'intercepteur à toutes les instances d'API
const apis = [authAPI, iaAPI, notificationAPI, dbAPI, paymentAPI];
apis.forEach(api => {
  api.interceptors.request.use(addAuthTokenInterceptor);
});
