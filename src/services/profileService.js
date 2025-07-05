import { dbAPI } from './axiosConfig';
import { getUser } from './authService';

// Service pour gérer les profils professionnels
export const completeProfile = async (profileData) => {
  try {
    // Récupérer les informations de l'utilisateur via le service d'authentification
    const user = await getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Mettre à jour le secteur d'activité et marquer le profil comme complété
    await dbAPI.put(`/users/${user.id}`, {
      sector: profileData.sector,
      isProfileCompleted: true
    });
    
    // Vérifier si un profil professionnel existe déjà
    try {
      // Tenter de récupérer le profil existant
      await dbAPI.get(`/professional-profiles/user/${user.id}`);
      
      // Si le profil existe, le mettre à jour
      return await dbAPI.put(`/professional-profiles/${user.id}`, {
        sector: profileData.sector,
        specialties: profileData.specialties,
        yearsOfExperience: profileData.yearsOfExperience
      });
    } catch (error) {
      // Si le profil n'existe pas (erreur 404), le créer
      if (error.response && error.response.status === 404) {
        return await dbAPI.post('/professional-profiles', {
          userId: user.id,
          sector: profileData.sector,
          specialties: profileData.specialties,
          yearsOfExperience: profileData.yearsOfExperience
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Erreur lors de la complétion du profil:', error);
    throw error;
  }
};

// Récupérer le profil professionnel de l'utilisateur connecté
export const getUserProfile = async () => {
  try {
    // Récupérer les informations de l'utilisateur via le service d'authentification
    const user = await getUser();
    if (!user) {
      console.error('Erreur: Aucune donnée utilisateur récupérée');
      throw new Error('Utilisateur non connecté');
    }
    
    if (!user.id) {
      console.error('Erreur: ID utilisateur manquant dans les données');
      throw new Error('Données utilisateur incomplètes');
    }
    
    console.log(`Tentative de récupération du profil professionnel pour l'utilisateur ${user.id}`);
    
    // Récupérer le profil professionnel
    try {
      const profileResponse = await dbAPI.get(`/professional-profiles/user/${user.id}`);
      console.log('Profil professionnel récupéré avec succès:', profileResponse.data);
      return profileResponse.data;
    } catch (apiError) {
      console.error('Erreur API lors de la récupération du profil:', apiError.response?.status, apiError.response?.data);
      
      // Si le profil n'existe pas, on peut retourner un objet vide ou null
      if (apiError.response && apiError.response.status === 404) {
        console.log('Profil professionnel non trouvé, retour null');
        return null;
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Erreur globale lors de la récupération du profil:', error);
    throw error;
  }
};

// Mettre à jour le profil professionnel
export const updateProfile = async (profileData) => {
  try {
    // Récupérer les informations de l'utilisateur via le service d'authentification
    const user = await getUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Mettre à jour le profil
    const response = await dbAPI.put(`/professional-profiles/${user.id}`, profileData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
}; 