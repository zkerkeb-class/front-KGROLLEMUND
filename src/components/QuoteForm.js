'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { iaAPI, dbAPI } from '@/services/axiosConfig';
import { getUserProfile } from '@/services/profileService';
import { getSectorName, getSpecialtyName } from '@/constants/specialties';
import { uploadDocumentForAnalysis } from '@/services/iaService';
import styles from '../styles/QuoteForm.module.css';

export default function QuoteForm({ user }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [quoteResponse, setQuoteResponse] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [professionalProfile, setProfessionalProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [quoteRequestId, setQuoteRequestId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [editedTasks, setEditedTasks] = useState([]);
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showPreviewButton, setShowPreviewButton] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Fonction pour extraire les valeurs min et max d'une fourchette
  const extractRangeValues = (value) => {
    if (typeof value !== 'string') return { min: value || 0, max: value || 0 };
    
    // Nettoyer la valeur (enlever les unités)
    const cleanValue = value.replace(/[€h]/g, '');
    
    // Si c'est une fourchette (ex: "20-30")
    if (cleanValue.includes('-')) {
      const parts = cleanValue.split('-');
      return {
        min: parseFloat(parts[0]) || 0,
        max: parseFloat(parts[1]) || parseFloat(parts[0]) || 0
      };
    }
    
    // Si c'est une valeur simple
    const numValue = parseFloat(cleanValue) || 0;
    return { min: numValue, max: numValue };
  };
  
  // Fonction pour calculer les totaux (min et max) à partir des tâches
  const calculateTotals = (tasks) => {
    let totalMinHours = 0;
    let totalMaxHours = 0;
    let totalMinCost = 0;
    let totalMaxCost = 0;
    
    tasks.forEach(task => {
      const hoursRange = extractRangeValues(task.estimatedHours);
      const costRange = extractRangeValues(task.estimatedCost);
      
      totalMinHours += hoursRange.min;
      totalMaxHours += hoursRange.max;
      totalMinCost += costRange.min;
      totalMaxCost += costRange.max;
    });
    
    return {
      hours: `${Math.round(totalMinHours)}-${Math.round(totalMaxHours)}h`,
      cost: `${Math.round(totalMinCost)}-${Math.round(totalMaxCost)}€`
    };
  };

  // Fonction pour afficher une valeur (fourchette ou précise)
  const displayValue = (value, unit = '') => {
    // Si la valeur est déjà formatée avec son unité, la retourner telle quelle
    if (typeof value === 'string' && (value.includes('€') || value.includes('h'))) {
      return value;
    }
    
    // Sinon, ajouter l'unité
    return `${value}${unit}`;
  };

  // Récupérer le profil professionnel au chargement
  useEffect(() => {
    const fetchProfile = async () => {
      if (user?.id) {
        try {
          const profile = await getUserProfile();
          setProfessionalProfile(profile);
        } catch (error) {
          console.error('Erreur lors du chargement du profil:', error);
        } finally {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  // Fonction pour gérer l'upload de fichier
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier les extensions autorisées
      const allowedExtensions = ['pdf'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        alert('Type de fichier non autorisé. Veuillez sélectionner un fichier PDF');
        return;
      }
      
      setUploadedFile(file);
      
      // Reset de l'analyse si un nouveau fichier est chargé
      setAiAnalysis(null);
      setAnalysisCompleted(false);
      setQuoteRequestId(null);
      setQuoteResponse(null);
    }
  };

  // Fonction pour analyser le fichier
  const analyzeFile = async () => {
    if (!uploadedFile) {
      alert('Veuillez d\'abord télécharger un fichier');
      return;
    }

    // Vérifier que les informations générales sont remplies
    const errors = {};
    if (!title.trim()) {
      errors.title = true;
    }
    if (!description.trim()) {
      errors.description = true;
    }
    if (!clientName.trim()) {
      errors.clientName = true;
    }
    if (!clientEmail.trim()) {
      errors.clientEmail = true;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      alert('Veuillez renseigner le titre, la description du projet et les informations client avant l\'analyse');
      return;
    }

    // Réinitialiser les erreurs si tout est correct
    setValidationErrors({});

    setAnalyzing(true);
    
    try {
      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      // Ajouter des métadonnées sur l'utilisateur et le projet pour améliorer l'analyse
      formData.append('userId', user.id);
      formData.append('projectTitle', title);
      formData.append('projectDescription', description);
      formData.append('isSubscribed', user.isSubscribed || false); // Statut d'abonnement
      if (professionalProfile) {
        formData.append('sector', professionalProfile.sector);
        formData.append('specialties', JSON.stringify(professionalProfile.specialties));
        formData.append('yearsOfExperience', professionalProfile.yearsOfExperience);
      }
      
      // Utiliser le service iaService pour l'analyse
      const analysisResult = await uploadDocumentForAnalysis(formData);
      
      setAiAnalysis(analysisResult);
      setAnalysisCompleted(true);
      
      // Stocker l'ID de la demande de devis créée lors de l'analyse
      if (analysisResult.quoteRequestId) {
        setQuoteRequestId(analysisResult.quoteRequestId);
        
        // Initialiser les tâches éditables avec les données d'analyse (sans complexité)
        if (analysisResult.tasksBreakdown && analysisResult.tasksBreakdown.length > 0) {
          setEditedTasks(analysisResult.tasksBreakdown.map(task => ({
            task: task.task,
            description: task.description,
            estimatedHours: task.estimatedHours,
            estimatedCost: task.estimatedCost,
            isEdited: false
        })));
        }
      }
      
      // Pré-remplir le titre et la description si détectés par l'IA (seulement s'ils sont vides)
      if (analysisResult.title && !title.trim()) {
        setTitle(analysisResult.title);
      }
      
      if (analysisResult.description && !description.trim()) {
        setDescription(analysisResult.description);
      }
      
      // Afficher la pop-up au lieu d'afficher directement les résultats
      setShowAnalysisPopup(true);
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse du fichier:', error);
      
      // Gestion spécifique des erreurs
      if (error.response) {
        // Erreur de quota OpenAI
        if (error.response.status === 429 || error.response.data?.error === 'quota_exceeded') {
          alert('Le service d\'analyse est temporairement indisponible en raison d\'un trafic élevé. Veuillez réessayer dans quelques minutes.');
        }
        // PDF corrompu
        else if (error.response.data?.error === 'corrupted_pdf') {
          alert('Le PDF fourni semble être corrompu et ne peut pas être analysé. Veuillez essayer avec un autre fichier PDF.');
        }
        // Autres erreurs de serveur
        else if (error.response.data?.message) {
          alert(error.response.data.message);
        } else {
      alert('Une erreur est survenue lors de l\'analyse du fichier');
        }
      } else {
        alert(error.message || 'Une erreur est survenue lors de l\'analyse du fichier');
      }
      
      // Réinitialiser le fichier pour que l'utilisateur puisse en télécharger un nouveau
      setUploadedFile(null);
    } finally {
      setAnalyzing(false);
    }
  };

  // Fonction pour gérer la fermeture de la pop-up d'analyse
  const handleCloseAnalysisPopup = () => {
    setShowAnalysisPopup(false);
    setShowPreviewButton(true); // Afficher le bouton persistant
  };

  // Fonction pour ouvrir la prévisualisation depuis la pop-up ou le bouton persistant
  const handleOpenPreview = () => {
    setShowAnalysisPopup(false);
    setShowPreviewButton(false);
    setShowPreviewPopup(true);
  };

  // Fonction pour fermer la pop-up de prévisualisation
  const handleClosePreviewPopup = () => {
    setShowPreviewPopup(false);
    setShowPreviewButton(true);
  };

  // Fonction pour passer en mode édition
  const handleEditQuote = () => {
    setShowPreviewPopup(false);
    setShowEditPopup(true);
  };

  // Fonction pour fermer la pop-up d'édition
  const handleCloseEditPopup = () => {
    setShowEditPopup(false);
    setShowPreviewButton(true);
  };
  
  // Fonction pour sauvegarder les modifications et créer le devis final
  const handleSaveEditedQuote = async () => {
    setLoading(true);
    
    try {
      // Calculer les totaux à partir des tâches éditées (gestion des fourchettes)
      const totalHours = editedTasks.reduce((sum, task) => sum + extractRangeValues(task.estimatedHours).min, 0);
      const totalCost = editedTasks.reduce((sum, task) => sum + extractRangeValues(task.estimatedCost).min, 0);
      
      // Créer le devis final en base de données avec les données éditées
      const iaResponse = await iaAPI.post('/quote', {
        quoteRequestId,
        clientEmail: clientEmail,
        clientName: clientName,
        updatedTasks: editedTasks,
        totalEstimate: totalCost,
        timeEstimate: totalHours
      });
      
      setQuoteResponse(iaResponse.data);
      setShowEditPopup(false);
      setPreviewMode(false);
      
      alert('Devis sauvegardé avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du devis:', error);
      alert('Une erreur est survenue lors de la sauvegarde du devis');
    } finally {
      setLoading(false);
    }
  };

  // Nouvelle fonction pour sauvegarder ET télécharger le PDF
  const handleSaveAndDownloadPdf = async () => {
    // Validation des champs obligatoires
    if (!clientEmail || !clientName) {
      alert('Veuillez remplir le nom et l\'email du client avant de télécharger le PDF.');
      return;
    }
    
    // Vérification des données d'analyse
    if (!aiAnalysis || !quoteRequestId) {
      alert('Erreur : données d\'analyse manquantes. Veuillez relancer l\'analyse.');
      return;
    }

    setLoading(true);
    
    try {
      // Calculer les totaux à partir des tâches éditées (gestion des fourchettes)
      const totalHours = editedTasks.reduce((sum, task) => sum + extractRangeValues(task.estimatedHours).min, 0);
      const totalCost = editedTasks.reduce((sum, task) => sum + extractRangeValues(task.estimatedCost).min, 0);
      
      // Créer le devis final en base de données avec les données éditées
      const quoteData = {
        quoteRequestId,
        clientEmail,
        clientName,
        updatedTasks: editedTasks,
        totalEstimate: totalCost,
        timeEstimate: totalHours,
        projectTitle: title || 'Projet',
        projectDescription: description || 'Description du projet'
      };
      
      console.log('🚀 Frontend: Sauvegarde + PDF du devis édité');
      console.log('Données:', quoteData);
      
      const response = await iaAPI.post('/quote', quoteData);
      const createdQuote = response.data;
      
      console.log('✅ Devis créé - ID:', createdQuote.id);
      
      // Télécharger le PDF immédiatement
      const pdfResponse = await iaAPI.get(`/quotes/pdf/${createdQuote.id}`, {
        responseType: 'blob'
      });
      
      // Détecter le type de contenu
      const contentType = pdfResponse.headers['content-type'];
      
      if (contentType.includes('text/html')) {
        // Si c'est du HTML, ouvrir dans un nouvel onglet pour impression
        const blob = new Blob([pdfResponse.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          newWindow.focus();
        }
        window.URL.revokeObjectURL(url);
        
        alert('Le devis s\'ouvre dans un nouvel onglet. Vous pouvez l\'imprimer en PDF depuis votre navigateur (Ctrl+P).');
      } else {
        // Créer un lien de téléchargement PDF
        const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `devis-${title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      // Fermer la popup et mettre à jour l'état
      setShowEditPopup(false);
      setShowPreviewButton(true);
      setQuoteResponse(createdQuote);
      setPreviewMode(false);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde et génération du PDF:', error);
      alert('Une erreur est survenue lors de la sauvegarde et génération du PDF');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour mettre à jour une tâche
  const handleTaskUpdate = (index, field, value) => {
    const updatedTasks = [...editedTasks];
    
    // Mise à jour directe de la valeur (texte ou fourchette)
    updatedTasks[index] = {
      ...updatedTasks[index],
      [field]: value,
      isEdited: true
    };
    setEditedTasks(updatedTasks);
  };

  // Fonction pour supprimer une tâche
  const handleRemoveTask = (index) => {
    const updatedTasks = editedTasks.filter((_, i) => i !== index);
    setEditedTasks(updatedTasks);
  };

  // Fonction pour ajouter une nouvelle tâche
  const handleAddTask = () => {
    // Créer une nouvelle tâche avec des fourchettes par défaut
    const newTask = {
      task: "Nouvelle tâche",
      description: "Description de la nouvelle tâche",
      estimatedHours: "20-30h",
      estimatedCost: "1000-1500€",
      isEdited: true
    };
    setEditedTasks([...editedTasks, newTask]);
  };

  // Fonction pour prévisualiser le devis
  const handlePreview = (e) => {
    e.preventDefault();
    
    // Vérifier que l'analyse a été effectuée
    if (!analysisCompleted || !aiAnalysis || !quoteRequestId) {
      alert('Veuillez d\'abord analyser le cahier des charges avant de prévisualiser le devis.');
      return;
    }
    
    // Ouvrir la pop-up de prévisualisation
    setShowPreviewPopup(true);
  };
  
  // Fonction pour soumettre le formulaire et générer le devis final
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier que l'analyse a été effectuée
    if (!analysisCompleted || !aiAnalysis || !quoteRequestId) {
      alert('Veuillez d\'abord analyser le cahier des charges avant de générer le devis.');
      return;
    }
    
    // Si on n'est pas en mode prévisualisation, passer en prévisualisation
    if (!previewMode) {
      handlePreview(e);
      return;
    }
    
    setLoading(true);
    
    try {
      // Calculer les totaux à partir des tâches éditées
      const totals = calculateTotals(editedTasks);
      
      // Mettre à jour les tâches dans la base de données
      await iaAPI.put(`/quote-requests/${quoteRequestId}/tasks`, {
        tasksEstimation: editedTasks,
        totalEstimate: totals.cost,
        timeEstimate: totals.hours
      });
      
      // Générer le devis basé sur l'analyse existante et les modifications
      const iaResponse = await iaAPI.post('/quote', {
        quoteRequestId,
        clientEmail,
        clientName,
        updatedTasks: editedTasks,
        totalEstimate: totals.cost,
        timeEstimate: totals.hours
      });
      
      setQuoteResponse(iaResponse.data);
      setPreviewMode(false); // Sortir du mode prévisualisation
      setShowPreviewPopup(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la génération du devis');
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour annuler le mode prévisualisation
  const handleCancelPreview = () => {
    setPreviewMode(false);
    setShowPreviewButton(true);
  };

  // Fonction pour télécharger le devis en PDF directement depuis la pop-up
  const handleDirectPdfDownload = async () => {
    // Validation des champs obligatoires
    if (!clientEmail || !clientName) {
      alert('Veuillez remplir le nom et l\'email du client avant de télécharger le PDF.');
      return;
    }
    
    // Vérification des données d'analyse
    if (!aiAnalysis || !quoteRequestId) {
      alert('Erreur : données d\'analyse manquantes. Veuillez relancer l\'analyse.');
      return;
    }

    setLoading(true);
    
    try {
      // Utiliser les tâches d'analyse ou éditées
      const tasksToUse = editedTasks.length > 0 ? editedTasks : aiAnalysis.tasksBreakdown || [];
      
      // Calculer les totaux avec notre fonction
      const totals = calculateTotals(tasksToUse);
      
      // Créer le devis final en base de données
      const quoteData = {
        quoteRequestId,
        clientEmail,
        clientName,
        updatedTasks: tasksToUse,
        totalEstimate: totals.cost,
        timeEstimate: totals.hours,
        projectTitle: title || 'Projet',
        projectDescription: description || 'Description du projet'
      };
      
      console.log('🚀 Frontend: Envoi vers service IA');
      console.log('Données:', quoteData);
      
      const response = await iaAPI.post('/quote', quoteData);
      const createdQuote = response.data;
      
      console.log('✅ Devis créé - ID:', createdQuote.id);
      
      // Télécharger le PDF immédiatement
      const pdfResponse = await iaAPI.get(`/quotes/pdf/${createdQuote.id}`, {
        responseType: 'blob'
      });
      
      // Détecter le type de contenu
      const contentType = pdfResponse.headers['content-type'];
      
      if (contentType.includes('text/html')) {
        // Si c'est du HTML, ouvrir dans un nouvel onglet pour impression
        const blob = new Blob([pdfResponse.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          newWindow.focus();
        }
        window.URL.revokeObjectURL(url);
        
        alert('Le devis s\'ouvre dans un nouvel onglet. Vous pouvez l\'imprimer en PDF depuis votre navigateur (Ctrl+P).');
      } else {
        // Créer un lien de téléchargement PDF
        const blob = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `devis-${title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
      setShowPreviewPopup(false);
      setShowPreviewButton(true);
      
      // Définir quoteResponse pour permettre le re-téléchargement
      setQuoteResponse(createdQuote);
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour télécharger le devis en PDF
  const downloadQuoteAsPdf = async () => {
    if (!quoteResponse || !quoteResponse.id) return;
    
    try {
      // Appeler l'API pour générer le PDF avec l'ID du devis
      const response = await iaAPI.get(`/quotes/pdf/${quoteResponse.id}`, {
        responseType: 'blob'
      });
      
      // Détecter le type de contenu
      const contentType = response.headers['content-type'];
      
      if (contentType.includes('text/html')) {
        // Si c'est du HTML, ouvrir dans un nouvel onglet pour impression
        const blob = new Blob([response.data], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (newWindow) {
          newWindow.focus();
        }
        window.URL.revokeObjectURL(url);
        
        alert('Le devis s\'ouvre dans un nouvel onglet. Vous pouvez l\'imprimer en PDF depuis votre navigateur (Ctrl+P).');
      } else {
        // Créer un lien de téléchargement PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `devis-${title.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF');
    }
  };

  // Fonction pour rediriger vers la page profil
  const handleEditProfile = () => {
    router.push('/profile');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Générateur de devis IA</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Section informations générales */}
        <div className={styles.section}>
          <h2>Informations générales</h2>
          
          <div className={styles.formGroup + ' ' + styles.fullWidth}>
            <label>Titre du projet <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // Supprimer l'erreur de validation quand l'utilisateur tape
                if (validationErrors.title && e.target.value.trim()) {
                  setValidationErrors(prev => ({ ...prev, title: false }));
                }
              }}
              required
              placeholder="Ex: Développement d'une application web e-commerce"
              className={validationErrors.title ? styles.errorInput : ''}
            />
          </div>
          
          <div className={styles.formGroup + ' ' + styles.fullWidth}>
            <label>Description du besoin client <span className={styles.required}>*</span></label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                // Supprimer l'erreur de validation quand l'utilisateur tape
                if (validationErrors.description && e.target.value.trim()) {
                  setValidationErrors(prev => ({ ...prev, description: false }));
                }
              }}
              rows={3}
              required
              placeholder="Décrivez brièvement le/les besoins du client"
              className={validationErrors.description ? styles.errorInput : ''}
            />
          </div>
          
          {/* Informations client */}
          <div className={styles.clientInfoGrid}>
            <div className={styles.formGroup}>
              <label>Nom du client <span className={styles.required}>*</span></label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  // Supprimer l'erreur de validation quand l'utilisateur tape
                  if (validationErrors.clientName && e.target.value.trim()) {
                    setValidationErrors(prev => ({ ...prev, clientName: false }));
                  }
                }}
                required
                placeholder="Nom de l'entreprise ou de la personne"
                className={validationErrors.clientName ? styles.errorInput : ''}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Email du client <span className={styles.required}>*</span></label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  // Supprimer l'erreur de validation quand l'utilisateur tape
                  if (validationErrors.clientEmail && e.target.value.trim()) {
                    setValidationErrors(prev => ({ ...prev, clientEmail: false }));
                  }
                }}
                required
                placeholder="email@entreprise.com"
                className={validationErrors.clientEmail ? styles.errorInput : ''}
              />
            </div>
          </div>
          
          <p className={styles.helpText}>
            <span className={styles.required}>*</span> Ces informations sont obligatoires pour une analyse précise de votre cahier des charges.
          </p>
        </div>
        
        {/* Section profil développeur */}
        <div className={styles.section}>
          <h2>Mon profil</h2>
          
          {profileLoading ? (
            <div className={styles.profileLoading}>
              <p>Chargement du profil...</p>
            </div>
          ) : !professionalProfile ? (
            <div className={styles.profileWarning}>
              <p>
                Vous n&apos;avez pas encore complété votre profil développeur. 
                <button 
                  type="button"
                  onClick={handleEditProfile}
                  className={styles.profileLink}
                >
                  Compléter mon profil
                </button> 
                pour obtenir un devis plus précis.
              </p>
            </div>
          ) : (
            <div className={styles.profileDisplay}>
              <div className={styles.profileActions}>
                <button
                  type="button"
                  onClick={handleEditProfile}
                  className={styles.editProfileBtn}
                >
                  Modifier mon profil
                </button>
              </div>
              
              <div className={styles.profileGrid}>
                <div className={styles.profileField}>
                  <strong>Secteur:</strong>
                  <span>{getSectorName(professionalProfile.sector)}</span>
                </div>

                <div className={styles.profileField}>
                  <strong>Spécialités:</strong>
                  <div className={styles.specialties}>
                    {professionalProfile.specialties && professionalProfile.specialties.length > 0 ? (
                      professionalProfile.specialties.map((specialty, index) => (
                        <span key={index} className={styles.specialty}>
                          {getSpecialtyName(professionalProfile.sector, specialty)}
                        </span>
                      ))
                    ) : (
                      <span className={styles.noSpecialties}>Aucune spécialité renseignée</span>
                    )}
                  </div>
                </div>
                
                <div className={styles.profileField}>
                  <strong>Expérience:</strong>
                  <span>{professionalProfile.yearsOfExperience} années</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section analyse de cahier des charges */}
        <div className={styles.section}>
          <h2>Analyse de cahier des charges</h2>
          <p className={styles.helpText}>
            Téléchargez un document (PDF) contenant votre cahier des charges ou vos spécifications pour une analyse automatique.
          </p>
          
          <div className={styles.fileUploadContainer}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className={styles.fileInput}
              accept=".pdf"
            />
            
            <div className={styles.uploadActions}>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current.click()}
              >
                Sélectionner un fichier
              </button>
              
              {uploadedFile && (
                <button
                  type="button"
                  onClick={analyzeFile}
                  disabled={analyzing}
                  className={styles.analyzeBtn}
                >
                  {analyzing ? 'Analyse en cours...' : 'Analyser le document'}
                </button>
              )}
            </div>
            
            {uploadedFile && (
              <div className={styles.fileInfo}>
                <p>Fichier: {uploadedFile.name}</p>
                <p>Type: {uploadedFile.type}</p>
                <p>Taille: {Math.round(uploadedFile.size / 1024)} KB</p>
                {analysisCompleted && (
                  <p className={styles.analysisStatus}>✅ Analyse terminée</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {!previewMode ? (
          <div className={styles.submitActions}>
            {/* <button
              type="submit"
              disabled={loading || !title || !description || !analysisCompleted}
              className={styles.submitBtn}
              title={!analysisCompleted ? "Veuillez d'abord analyser le cahier des charges" : ""}
            >

            </button> */}
            
            {!analysisCompleted && (
              <p className={styles.submitWarning}>
                ⚠️ L&apos;analyse du cahier des charges est obligatoire avant la prévisualisation du devis
              </p>
            )}
          </div>
        ) : (
          <div className={styles.previewSection}>
            <h2>Édition des estimations</h2>
            <p className={styles.helpText}>
              Vous pouvez modifier les estimations générées par l&apos;IA avant de finaliser le devis.
            </p>
            
            <div className={styles.tasksTable + ' ' + styles.editableTable}>
              <div className={styles.tableHeader}>
                <span>Tâche</span>
                <span>Temps (h)</span>
                <span>Coût (€)</span>
                <span>Actions</span>
              </div>
              
              {editedTasks.map((task, index) => (
                <div key={index} className={`${styles.tableRow} ${task.isEdited ? styles.editedRow : ''}`}>
                  <div className={styles.taskInfo}>
                    <input
                      type="text"
                      className={styles.taskNameInput}
                      value={task.task}
                      onChange={(e) => handleTaskUpdate(index, 'task', e.target.value)}
                      placeholder="Nom de la tâche"
                    />
                    <textarea
                      className={styles.taskDescriptionInput}
                      value={task.description}
                      onChange={(e) => handleTaskUpdate(index, 'description', e.target.value)}
                      placeholder="Description de la tâche"
                      rows="2"
                    />
                  </div>
                  
                  <div className={styles.timeInput}>
                    <input
                      type="text"
                      className={styles.rangeInput}
                      value={task.estimatedHours}
                      onChange={(e) => handleTaskUpdate(index, 'estimatedHours', e.target.value)}
                      placeholder="ex: 20-30h"
                    />
                  </div>
                  
                  <div className={styles.costInput}>
                    <input
                      type="text"
                      className={styles.rangeInput}
                      value={task.estimatedCost}
                      onChange={(e) => handleTaskUpdate(index, 'estimatedCost', e.target.value)}
                      placeholder="ex: 1000-1500€"
                    />
                  </div>
                  
                  <div className={styles.taskActions}>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(index)}
                      className={styles.removeTaskBtn}
                      title="Supprimer cette tâche"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              
              <div className={styles.tableTotal}>
                <span className={styles.totalLabel}>Total estimé</span>
                <span className={styles.totalHours}>
                  {calculateTotals(editedTasks).hours}
                </span>
                <span className={styles.totalCost}>
                  {calculateTotals(editedTasks).cost}
                </span>
                <span></span>
              </div>
              
              <div className={styles.addTaskRow}>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className={styles.addTaskBtn}
                >
                  ➕ Ajouter une tâche
                </button>
              </div>
            </div>
            
            <div className={styles.previewActions}>
              <button
                type="button"
                onClick={handleCancelPreview}
                className={styles.cancelBtn}
              >
                Retour
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? 'Génération en cours...' : 'Générer le devis final'}
              </button>
            </div>
          </div>
        )}
      </form>
      
      {/* Pop-up d'analyse terminée */}
      {showAnalysisPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.analysisCompletedPopup}>
            <div className={styles.popupHeader}>
              <h3>🎉 Analyse terminée !</h3>
              <button
                onClick={handleCloseAnalysisPopup}
                className={styles.popupCloseBtn}
              >
                ✕
              </button>
            </div>
            <div className={styles.popupContent}>
              <p>
                L&apos;analyse de votre cahier des charges est maintenant terminée. 
                Vous pouvez consulter les résultats détaillés et procéder à la génération du devis.
              </p>
            </div>
            <div className={styles.popupActions}>
              <button
                onClick={handleOpenPreview}
                className={styles.previewBtn}
              >
                📊 Prévisualiser les résultats
              </button>
              <button
                onClick={handleCloseAnalysisPopup}
                className={styles.closeBtn}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up de prévisualisation avec options */}
      {showPreviewPopup && aiAnalysis && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup + ' ' + styles.largePopup}>
            <div className={styles.popupHeader}>
              <h3>📊 Prévisualisation du devis</h3>
              <button
                onClick={handleClosePreviewPopup}
                className={styles.popupCloseBtn}
              >
                ✕
              </button>
            </div>
            <div className={styles.popupContent + ' ' + styles.previewContent}>
              
              {aiAnalysis.summary && (
                <div className={styles.analysisSummary}>
                  <h4>Résumé</h4>
                  <p>{aiAnalysis.summary}</p>
                </div>
              )}
              
              {aiAnalysis.detectedTechnologies && aiAnalysis.detectedTechnologies.length > 0 && (
                <div className={styles.analysisTechnologies}>
                  <h4>Technologies détectées</h4>
                  <ul>
                    {aiAnalysis.detectedTechnologies.map((tech, index) => (
                      <li key={index}>{tech}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {aiAnalysis.tasksBreakdown && aiAnalysis.tasksBreakdown.length > 0 && (
                <div className={styles.analysisBreakdown}>
                  <h4>
                    Estimation par tâche
                    
                  </h4>
                  <div className={styles.tasksTable}>
                    <div className={styles.tableHeader}>
                      <span>Tâche</span>
                      <span>Temps (h)</span>
                      <span>Coût (€)</span>
                    </div>
                    {aiAnalysis.tasksBreakdown.map((task, index) => (
                      <div key={index} className={styles.tableRow}>
                        <div className={styles.taskInfo}>
                          <strong>{task.task}</strong>
                          <p className={styles.taskDescription}>{task.description}</p>
                        </div>
                        <span className={styles.hours}>{displayValue(task.estimatedHours, 'h')}</span>
                        <span className={styles.cost}>{displayValue(task.estimatedCost, '€')}</span>
                      </div>
                    ))}
                    
                    {(aiAnalysis.totalEstimatedHours || aiAnalysis.totalEstimatedCost) && (
                      <div className={styles.tableTotal}>
                        <span className={styles.totalLabel}>Total estimé</span>
                        <span className={styles.totalHours}>
                          {displayValue(aiAnalysis.totalEstimatedHours, 'h')}
                        </span>
                        <span className={styles.totalCost}>
                          {displayValue(aiAnalysis.totalEstimatedCost, '€')}
                        </span>
            </div>
          )}
        </div>
                </div>
              )}
              
              {aiAnalysis.recommendations && (
                <div className={styles.analysisRecommendations}>
                  <h4>Recommandations</h4>
                  <p>{aiAnalysis.recommendations}</p>
                </div>
              )}
            </div>
            <div className={styles.popupActions + ' ' + styles.previewActions}>
              <button
                onClick={handleDirectPdfDownload}
                disabled={loading || !clientEmail || !clientName}
                className={styles.downloadBtn}
                title={(!clientEmail || !clientName) ? "Veuillez remplir les informations client" : ""}
              >
                {loading ? 'Génération...' : '📄 Télécharger PDF'}
              </button>
              <button
                onClick={handleEditQuote}
                className={styles.editBtn}
              >
                ✏️ Éditer le devis
              </button>
              <button
                onClick={handleClosePreviewPopup}
                className={styles.closeBtn}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bouton persistant de prévisualisation */}
      {showPreviewButton && (
        <div className={styles.floatingButton}>
          <button
            onClick={handleOpenPreview}
            className={styles.floatingPreviewBtn}
            title="Prévisualiser les résultats d'analyse"
          >
            📊 Prévisualiser l&apos;analyse
          </button>
            </div>
          )}
          
      {/* Pop-up d'édition du devis */}
      {showEditPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup + ' ' + styles.largePopup}>
            <div className={styles.popupHeader}>
              <h3>✏️ Édition du devis</h3>
              <button
                onClick={handleCloseEditPopup}
                className={styles.popupCloseBtn}
              >
                ✕
              </button>
            </div>
            <div className={styles.popupContent + ' ' + styles.previewContent}>
              
              {/* Édition des tâches */}
              <div className={styles.section}>
                <h4>✏️ Édition des estimations</h4>
                <p className={styles.helpText}>
                   Modifiez les estimations générées par l&apos;IA selon vos besoins.
                   {!user?.isSubscribed && (
                     <span className={styles.upgradeHint}>
                       💡 <strong>Passez à l&apos;abonnement Premium</strong> pour obtenir des estimations précises au lieu de fourchettes !
                     </span>
                   )}
                 </p>
                
                <div className={styles.tasksTable + ' ' + styles.editableTable}>
                  <div className={styles.tableHeader}>
                    <span>Tâche</span>
                    <span>Temps (h)</span>
                    <span>Coût (€)</span>
                    <span>Actions</span>
                  </div>
                
                  {editedTasks.map((task, index) => (
                    <div key={index} className={`${styles.tableRow} ${task.isEdited ? styles.editedRow : ''}`}>
                      <div className={styles.taskInfo}>
                        <input
                          type="text"
                          className={styles.taskNameInput}
                          value={task.task}
                          onChange={(e) => handleTaskUpdate(index, 'task', e.target.value)}
                          placeholder="Nom de la tâche"
                        />
                        <textarea
                          className={styles.taskDescriptionInput}
                          value={task.description}
                          onChange={(e) => handleTaskUpdate(index, 'description', e.target.value)}
                          placeholder="Description de la tâche"
                          rows="2"
                        />
                      </div>
                
                      {/* Afficher différemment selon que c'est une fourchette ou une valeur précise */}
                      <div className={styles.timeInput}>
                        <input
                          type="text"
                          className={styles.rangeInput}
                          value={task.estimatedHours}
                          onChange={(e) => handleTaskUpdate(index, 'estimatedHours', e.target.value)}
                          placeholder="ex: 20-30h"
                        />
                      </div>
                      
                      {/* Même chose pour le coût */}
                      <div className={styles.costInput}>
                        <input
                          type="text"
                          className={styles.rangeInput}
                          value={task.estimatedCost}
                          onChange={(e) => handleTaskUpdate(index, 'estimatedCost', e.target.value)}
                          placeholder="ex: 1000-1500€"
                        />
                      </div>
                      
                      <div className={styles.taskActions}>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(index)}
                          className={styles.removeTaskBtn}
                          title="Supprimer cette tâche"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <div className={styles.tableTotal}>
                    <span className={styles.totalLabel}>Total estimé</span>
                    <span className={styles.totalHours}>
                      {calculateTotals(editedTasks).hours}
                    </span>
                    <span className={styles.totalCost}>
                      {calculateTotals(editedTasks).cost}
                    </span>
                    <span></span>
                  </div>
                  
                  <div className={styles.addTaskRow}>
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className={styles.addTaskBtn}
                    >
                      ➕ Ajouter une tâche
                    </button>
                  </div>
                </div>
                </div>
              </div>
              
            <div className={styles.popupActions + ' ' + styles.previewActions}>
              <button
                onClick={handleSaveAndDownloadPdf}
                disabled={loading || !clientEmail || !clientName}
                className={styles.downloadBtn}
                title={(!clientEmail || !clientName) ? "Veuillez remplir les informations client" : ""}
              >
                {loading ? 'Génération...' : '💾📄 Sauvegarder & Télécharger PDF'}
              </button>
              <button
                onClick={handleCloseEditPopup}
                className={styles.closeBtn}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
} 