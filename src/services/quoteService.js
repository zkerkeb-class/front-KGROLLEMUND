import { dbAPI, iaAPI } from './axiosConfig';
import { getUser } from './authService';

/**
 * Récupère tous les devis pour l'utilisateur actuellement connecté.
 */
export const getQuotesForUser = async () => {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }
    const response = await dbAPI.get(`/quotes/user/${user.id}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des devis de l\'utilisateur:', error);
    throw error;
  }
};

/**
 * Télécharge un devis en PDF.
 * @param {string} quoteId - L'ID du devis à télécharger.
 */
export const downloadQuotePDF = async (quoteId) => {
  try {
    const response = await iaAPI.get(`/quotes/pdf/${quoteId}`, {
      responseType: 'blob', // Important pour recevoir un fichier
    });

    // Créer un lien pour télécharger le fichier
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `devis-${quoteId}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    // Nettoyer
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Erreur lors du téléchargement du PDF du devis:', error);
    throw error;
  }
};

/**
 * Récupère les statistiques des devis pour l'utilisateur.
 */
export const getQuoteStats = async () => {
  try {
    const user = await getUser();
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }
    const response = await dbAPI.get(`/quotes/stats/${user.id}`);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des devis:', error);
    throw error;
  }
}; 