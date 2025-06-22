import { dbAPI, authAPI } from './axiosConfig';

// Service pour gérer les profils professionnels
export const completeProfile = async (profileData) => {
  try {
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const userString = localStorage.getItem('user');
    if (!userString) {
      throw new Error('Utilisateur non connecté');
    }
    
    const user = JSON.parse(userString);
    
    // Mettre à jour le secteur d'activité et marquer le profil comme complété
    await dbAPI.put(`/api/users/${user.id}`, {
      sector: profileData.sector,
      isProfileCompleted: true
    });
    
    // Vérifier si un profil professionnel existe déjà
    try {
      // Tenter de récupérer le profil existant
      await dbAPI.get(`/api/professional-profiles/user/${user.id}`);
      
      // Si le profil existe, le mettre à jour
      return await dbAPI.put(`/api/professional-profiles/${user.id}`, {
        sector: profileData.sector,
        specialties: profileData.specialties,
        yearsOfExperience: profileData.yearsOfExperience
      });
    } catch (error) {
      // Si le profil n'existe pas (erreur 404), le créer
      if (error.response && error.response.status === 404) {
        return await dbAPI.post('/api/professional-profiles', {
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
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const userString = localStorage.getItem('user');
    if (!userString) {
      console.error('Erreur: Aucune donnée utilisateur dans localStorage');
      throw new Error('Utilisateur non connecté');
    }
    
    let user;
    try {
      user = JSON.parse(userString);
    } catch (parseError) {
      console.error('Erreur lors du parsing des données utilisateur:', parseError);
      throw new Error('Format de données utilisateur invalide');
    }
    
    if (!user.id) {
      console.error('Erreur: ID utilisateur manquant dans les données');
      throw new Error('Données utilisateur incomplètes');
    }
    
    console.log(`Tentative de récupération du profil professionnel pour l'utilisateur ${user.id}`);
    
    // Récupérer le profil professionnel
    try {
      const profileResponse = await dbAPI.get(`/api/professional-profiles/user/${user.id}`);
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
    // Récupérer les informations de l'utilisateur depuis le localStorage
    const userString = localStorage.getItem('user');
    if (!userString) {
      throw new Error('Utilisateur non connecté');
    }
    
    const user = JSON.parse(userString);
    
    // Mettre à jour le profil
    const response = await dbAPI.put(`/api/professional-profiles/${user.id}`, profileData);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    throw error;
  }
}; 