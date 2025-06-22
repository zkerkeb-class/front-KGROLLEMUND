import { iaAPI, dbAPI } from './axiosConfig';

// Services d'IA
export const generateQuote = (quoteData) => 
  iaAPI.post('/quote', quoteData);

// Récupérer les devis générés
export const getQuotes = () => 
  dbAPI.get('/quotes');

export const getQuoteById = (quoteId) => 
  dbAPI.get(`/quotes/${quoteId}`);

// Nouvelle fonction pour analyser des données
export const analyzeData = (data) => 
  iaAPI.post('/analyze', data);

// Fonction pour obtenir des recommendations
export const getRecommendations = (userId) => 
  iaAPI.get(`/recommendations/${userId}`);

// Fonction pour la génération d'insights
export const generateInsights = (data) => 
  iaAPI.post('/insights', data); 