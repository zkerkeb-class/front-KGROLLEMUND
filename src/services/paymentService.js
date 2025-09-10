import { paymentAPI } from './axiosConfig';

// Services de paiement (Stripe)
export const getPlans = async () => {
  const response = await paymentAPI.get('/plans');
  return response.data; // Extraction des données de la réponse
};

export const createSubscription = async (subscriptionData) => {
  const response = await paymentAPI.post('/create-subscription', subscriptionData);
  return response.data; // Extraction des données de la réponse
};

export const cancelSubscription = (subscriptionId) => 
  paymentAPI.post('/cancel-subscription', { subscriptionId });

export const updateSubscription = (subscriptionId, newPlanId) => 
  paymentAPI.post('/update-subscription', { subscriptionId, newPlanId });

export const getSubscriptionStatus = (userId) => 
  paymentAPI.get(`/subscription-status/${userId}`);

export const getPaymentHistory = (userId) => 
  paymentAPI.get(`/payment-history/${userId}`);

// Fonction pour créer une session de paiement Stripe
export const createCheckoutSession = (sessionData) => {
  return paymentAPI.post('/create-checkout-session', sessionData);
}; 