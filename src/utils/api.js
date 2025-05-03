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

// Add request interceptor to add auth token to requests
const addAuthToken = (config) => {
  const token = localStorage.getItem('token');
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
    console.log('Vérification du token, URL:', `${AUTH_SERVICE_URL}/verify`);
    return authAxios.get('/verify')
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
    console.log('Debug verify, URL:', `${AUTH_SERVICE_URL}/debug-verify`);
    return authAxios.get('/debug-verify');
  },
  
  // List available routes
  listRoutes: () => {
    return authAxios.get('/');
  },
  
  // Test database connection
  testDbConnection: () => {
    return authAxios.get('/test-db-connection');
  },

  // Test authentification service configuration
  testAuthService: () => {
    console.log('Appel du test du service d\'auth. URL:', `${AUTH_SERVICE_URL}/test`);
    return authAxios.get('/test');
  },

  // Logout
  logout: () => {
    return authAxios.post('/logout');
  },

  // OAuth URLs directes
  getGoogleAuthUrl: () => `${AUTH_SERVICE_URL}/api/auth/google`,
  getLinkedInAuthUrl: () => `${AUTH_SERVICE_URL}/api/auth/linkedin`,
  getGithubAuthUrl: () => `${AUTH_SERVICE_URL}/api/auth/github`,
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