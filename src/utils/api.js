import axios from 'axios';

// Define API service URLs sans préfixes
const AUTH_SERVICE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001';
const DB_SERVICE_URL = process.env.NEXT_PUBLIC_DB_SERVICE_URL || 'http://localhost:3004';

// Affichage des URLs pour debug
console.log('Configuration API:');
console.log('- Auth Service URL:', AUTH_SERVICE_URL);
console.log('- DB Service URL:', DB_SERVICE_URL);

// Create axios instances with default configuration
const authAxios = axios.create({
  baseURL: AUTH_SERVICE_URL,
  withCredentials: true,
});

const dbAxios = axios.create({
  baseURL: DB_SERVICE_URL,
});

// Fonction pour récupérer un cookie par son nom
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Add request interceptor to add auth token to requests
const addAuthToken = (config) => {
  // Essayer d'abord le localStorage
  let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Si pas de token dans localStorage, essayer les cookies
  if (!token) {
    token = getCookie('token');
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Add interceptors to both axios instances
authAxios.interceptors.request.use(addAuthToken);
dbAxios.interceptors.request.use(addAuthToken);

// Authentication service
export const authService = {
  // Vérification du token
  verify: () => {
    console.log('Vérification du token, URL:', `${AUTH_SERVICE_URL}/api/auth/verify`);
    return authAxios.get('/api/auth/verify')
      .catch(error => {
        console.error('Verify error:', error.response?.data || error.message);
        
        // Network error or server not running
        if (error.code === 'ERR_NETWORK') {
          throw new Error('Le serveur d\'authentification n\'est pas accessible. Vérifiez qu\'il est démarré.');
        }
        throw error;
      });
  },
  
  // Debug verify token
  debugVerify: () => {
    console.log('Debug verify, URL:', `${AUTH_SERVICE_URL}/api/auth/debug-verify`);
    return authAxios.get('/api/auth/debug-verify');
  },
  
  // List available routes
  listRoutes: () => {
    return authAxios.get('/api/auth');
  },
  
  // Test database connection
  testDbConnection: () => {
    return authAxios.get('/api/auth/test-db-connection');
  },

  // Test authentification service configuration
  testAuthService: () => {
    console.log('Appel du test du service d\'auth. URL:', `${AUTH_SERVICE_URL}/api/auth/test`);
    return authAxios.get('/api/auth/test');
  },

  // Logout
  logout: async () => {
    // Supprimer les données du localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Supprimer les cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'isProfileCompleted=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Rediriger vers la page de login avec un paramètre de déconnexion réussie
    window.location.href = '/login?logout=success';
  },

  // OAuth URLs directes
  getGoogleAuthUrl: () => `${AUTH_SERVICE_URL}/api/auth/google`,
  getLinkedInAuthUrl: () => `${AUTH_SERVICE_URL}/api/auth/linkedin`,
  getGithubAuthUrl: () => `${AUTH_SERVICE_URL}/api/auth/github`,
  
  // Nouvelles méthodes pour l'authentification classique
  register: async (name, email, password, phoneNumber) => {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, phoneNumber }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
    
    return response.json();
  },
  
  login: async (email, password) => {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la connexion');
    }
    
    return response.json();
  },
  
  requestPasswordReset: async (data) => {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la demande de réinitialisation');
    }
    
    return response.json();
  },
  
  verifyResetCode: async (phoneNumber, resetCode) => {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify-reset-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, resetCode }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Code de réinitialisation invalide');
    }
    
    return response.json();
  },
  
  resetPasswordWithCode: async (tempToken, userId, password) => {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/reset-password-with-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tempToken, userId, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
    
    return response.json();
  },
  
  verifyEmail: async (token, email) => {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, email }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la vérification de l\'email');
    }
    
    return response.json();
  },
};

// User service
export const userService = {
  // Get user by ID
  getUser: (userId) => {
    return dbAxios.get(`/users/${userId}`);
  },
  
  // Get all users (admin)
  getAllUsers: () => {
    return dbAxios.get('/users');
  },
};

// Quote service
export const quoteService = {
  // Create a new quote
  createQuote: (quoteData) => {
    return dbAxios.post('/quotes', quoteData);
  },
  
  // Get quotes for current user
  getUserQuotes: () => {
    return dbAxios.get('/quotes/user');
  },
  
  // Get a specific quote
  getQuote: (quoteId) => {
    return dbAxios.get(`/quotes/${quoteId}`);
  },
}; 