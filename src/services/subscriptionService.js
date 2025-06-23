import { paymentAPI } from './axiosConfig';

export const subscriptionService = {
  // Annuler un abonnement
  cancelSubscription: async (subscriptionId) => {
    try {
      const response = await paymentAPI.post('/cancel-subscription', {
        subscriptionId
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
      throw error;
    }
  },

  // Vérifier le statut d'un abonnement
  checkSubscriptionStatus: async (subscriptionId) => {
    try {
      const response = await paymentAPI.get(`/subscription/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
      throw error;
    }
  },

  // Récupérer les plans disponibles
  getPlans: async () => {
    try {
      const response = await paymentAPI.get('/plans');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des plans:', error);
      throw error;
    }
  }
}; 