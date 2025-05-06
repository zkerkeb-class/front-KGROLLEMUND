import axios from 'axios';

// Création d'instances axios pour chaque service
export const authAPI = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const iaAPI = axios.create({
  baseURL: 'http://localhost:3002/api',
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
  baseURL: 'http://localhost:3004/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Appliquer l'intercepteur à toutes les instances
[authAPI, iaAPI, notificationAPI, dbAPI].forEach(instance => {
  instance.interceptors.request.use(addAuthToken);
});

// Services d'authentification
export const authService = {
  login: (credentials) => authAPI.post('/auth/login', credentials),
  register: (userData) => authAPI.post('/auth/register', userData),
  verify: () => authAPI.get('/auth/verify'),
  logout: () => authAPI.post('/auth/logout'),
  
  // URLs pour les redirections OAuth
  getGoogleAuthUrl: () => `${authAPI.defaults.baseURL}/auth/google`,
  getLinkedInAuthUrl: () => `${authAPI.defaults.baseURL}/auth/linkedin`,
  getGithubAuthUrl: () => `${authAPI.defaults.baseURL}/auth/github`
};

// Services IA
export const iaService = {
  generateQuote: (quoteData) => iaAPI.post('/quote', quoteData),
  getQuotes: () => dbAPI.get('/quotes')
};

// Services de notification
export const notificationService = {
  sendEmail: (emailData) => notificationAPI.post('/send-email', emailData)
};

// Services de base de données
export const dbService = {
  getUsers: () => dbAPI.get('/users'),
  updateSubscription: (userId, isSubscribed) => 
    dbAPI.put(`/users/${userId}/subscription`, { isSubscribed })
};