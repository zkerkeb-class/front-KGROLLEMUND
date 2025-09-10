import { iaAPI, dbAPI } from './axiosConfig';

// Services d'IA
export const generateQuote = (quoteData) => 
  iaAPI.post('/quote', quoteData);

// Récupérer les devis générés
export const getQuotes = () => 
  dbAPI.get('/quotes');

export const getQuoteById = (quoteId) => 
  dbAPI.get(`/quotes/${quoteId}`);

// Fonction pour uploader et analyser un document
export const uploadDocumentForAnalysis = async (formData) => {
  try {
    const response = await iaAPI.post('/analyze-document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    // Amélioration de la gestion des erreurs
    if (error.response) {
      // Erreur de quota OpenAI
      if (error.response.status === 429 || error.response.data?.error === 'quota_exceeded') {
        console.error('Erreur de quota OpenAI:', error.response.data);
      }
      // Autres erreurs avec réponse du serveur
      throw error;
    } else if (error.request) {
      // La requête a été faite mais pas de réponse
      console.error('Pas de réponse du serveur:', error.request);
      throw new Error('Le service d\'analyse ne répond pas. Veuillez réessayer plus tard.');
    } else {
      // Erreur lors de la configuration de la requête
      console.error('Erreur de requête:', error.message);
      throw error;
    }
  }
};

// Nouvelle fonction pour analyser des données
export const analyzeData = (data) => 
  iaAPI.post('/analyze', data);

// Fonction pour obtenir des recommendations
export const getRecommendations = (userId) => 
  iaAPI.get(`/recommendations/${userId}`);

// Fonction pour la génération d'insights
export const generateInsights = (data) => 
  iaAPI.post('/insights', data); 