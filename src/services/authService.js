import { authAPI, dbAPI } from './axiosConfig';

// Services d'authentification
export const login = (credentials) => authAPI.post('/auth/login', credentials);
export const register = (userData) => authAPI.post('/auth/register', userData);
export const verify = () => authAPI.get('/auth/verify');
export const logout = async () => {
  try {
    // Obtenir le provider depuis le token si possible
    let provider = '';
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          provider = payload.provider || payload.oauthProvider || '';
          console.log('Provider extrait du token:', provider);
        }
      } catch (e) {
        console.error('Erreur lors du décodage du token:', e);
      }
    }
    
    // Appeler l'API de déconnexion du serveur avec le provider
    const response = await authAPI.post('/auth/logout', { provider });
    console.log('Réponse du serveur de déconnexion:', response.data);
    
    // Supprimer le token JWT du stockage local
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    
    // Supprimer également les cookies liés à l'authentification
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    console.log('Déconnexion réussie, token supprimé');
    return response;
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    
    // Même en cas d'erreur, on supprime le token côté client
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    throw error;
  }
};

// URLs pour les redirections OAuth
export const getGoogleAuthUrl = () => `${authAPI.defaults.baseURL}/auth/google`;
export const getLinkedInAuthUrl = () => `${authAPI.defaults.baseURL}/auth/linkedin`;
export const getGithubAuthUrl = () => `${authAPI.defaults.baseURL}/auth/github`;

// Fonction pour récupérer les informations de l'utilisateur connecté
export const getUser = async () => {
  try {
    // Pour le débogage
    console.log('Tentative de récupération des informations utilisateur');
    console.log('URL de base authAPI:', authAPI.defaults.baseURL);
    
    // Vérifier si le token est valide
    const response = await verify();
    console.log('Réponse de verify:', response);
    
    if (response.status === 200) {
      if (response.data && response.data.user) {
        // Si la réponse contient directement l'objet utilisateur
        return response.data.user;
      } else if (response.data && response.data.userId) {
        // Si la réponse contient juste l'ID de l'utilisateur, récupérer les détails
        const userId = response.data.userId;
        const userResponse = await dbAPI.get(`/users/${userId}`);
        return userResponse.data;
      }
    }
    
    throw new Error('Non authentifié');
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    throw new Error('Impossible de récupérer les informations utilisateur');
  }
};

// Fonction pour vérifier si l'utilisateur est authentifié
export const isAuthenticated = async () => {
  try {
    await verify();
    return true;
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return false;
  }
}; 