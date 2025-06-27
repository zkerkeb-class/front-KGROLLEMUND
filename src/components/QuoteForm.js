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
  const [showAnalysisPopup, setShowAnalysisPopup] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [showPreviewButton, setShowPreviewButton] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

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

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      alert('Veuillez renseigner le titre et la description du projet avant l\'analyse');
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
    
    // Auto-remplir l'email du client avec celui de l'utilisateur connecté
    if (!clientEmail && user?.email) {
      setClientEmail(user.email);
    }
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
      // Calculer les totaux à partir des tâches éditées
      const totalHours = editedTasks.reduce((sum, task) => sum + Number(task.estimatedHours || 0), 0);
      const totalCost = editedTasks.reduce((sum, task) => sum + Number(task.estimatedCost || 0), 0);
      
      // Créer le devis final en base de données avec les données éditées
      const iaResponse = await iaAPI.post('/quote', {
        quoteRequestId,
        clientEmail: clientEmail || user?.email || '',
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
  
  // Fonction pour mettre à jour une tâche
  const handleTaskUpdate = (index, field, value) => {
    const updatedTasks = [...editedTasks];
    updatedTasks[index] = {
      ...updatedTasks[index],
      [field]: value,
      isEdited: true
    };
    setEditedTasks(updatedTasks);
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
      const totalHours = editedTasks.reduce((sum, task) => sum + Number(task.estimatedHours || 0), 0);
      const totalCost = editedTasks.reduce((sum, task) => sum + Number(task.estimatedCost || 0), 0);
      
      // Mettre à jour les tâches dans la base de données
      await iaAPI.put(`/quote-requests/${quoteRequestId}/tasks`, {
        tasksEstimation: editedTasks,
        totalEstimate: totalCost,
        timeEstimate: totalHours
      });
      
      // Générer le devis basé sur l'analyse existante et les modifications
      const iaResponse = await iaAPI.post('/quote', {
        quoteRequestId,
        clientEmail,
        updatedTasks: editedTasks,
        totalEstimate: totalCost,
        timeEstimate: totalHours
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
    if (!clientEmail) {
      alert('Veuillez remplir l\'email du client avant de télécharger le PDF.');
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
      
      // Calculer les totaux
      const totalHours = tasksToUse.reduce((sum, task) => sum + Number(task.estimatedHours || 0), 0);
      const totalCost = tasksToUse.reduce((sum, task) => sum + Number(task.estimatedCost || 0), 0);
      
      // Créer le devis final en base de données
      const quoteData = {
        quoteRequestId,
        clientEmail,
        updatedTasks: tasksToUse,
        totalEstimate: totalCost,
        timeEstimate: totalHours,
        projectTitle: title || 'Projet',
        projectDescription: description || 'Description du projet'
      };
      
      console.log('🚀 Frontend: Envoi vers service IA');
      console.log('URL:', 'http://localhost:3005/api/quote');
      console.log('Données:', quoteData);
      
      const quoteResponse = await iaAPI.post('/quote', quoteData);
      const createdQuote = quoteResponse.data;
      
      console.log('✅ Devis créé - ID:', createdQuote.id);
      
      // Télécharger le PDF immédiatement
      const response = await iaAPI.get(`/quotes/pdf/${createdQuote.id}`, {
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
            <label>Description du projet <span className={styles.required}>*</span></label>
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
              placeholder="Décrivez brièvement votre projet, ses objectifs et fonctionnalités principales"
              className={validationErrors.description ? styles.errorInput : ''}
            />
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
              </div>
              
              {editedTasks.map((task, index) => (
                <div key={index} className={`${styles.tableRow} ${task.isEdited ? styles.editedRow : ''}`}>
                  <div className={styles.taskInfo}>
                    <strong>{task.task}</strong>
                    <p className={styles.taskDescription}>{task.description}</p>
                  </div>
                  
                  <input
                    type="number"
                    className={styles.timeInput}
                    value={task.estimatedHours}
                    onChange={(e) => handleTaskUpdate(index, 'estimatedHours', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                  
                  <input
                    type="number"
                    className={styles.costInput}
                    value={task.estimatedCost}
                    onChange={(e) => handleTaskUpdate(index, 'estimatedCost', parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>
              ))}
              
              <div className={styles.tableTotal}>
                <span className={styles.totalLabel}>Total estimé</span>
                <span className={styles.totalHours}>
                  {editedTasks.reduce((sum, task) => sum + Number(task.estimatedHours || 0), 0)}h
                </span>
                <span className={styles.totalCost}>
                  {editedTasks.reduce((sum, task) => sum + Number(task.estimatedCost || 0), 0)}€
                </span>
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
                  <h4>Estimation par tâche</h4>
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
                        <span className={styles.hours}>{task.estimatedHours}h</span>
                        <span className={styles.cost}>{task.estimatedCost}€</span>
                      </div>
                    ))}
                    
                    {(aiAnalysis.totalEstimatedHours || aiAnalysis.totalEstimatedCost) && (
                      <div className={styles.tableTotal}>
                        <span className={styles.totalLabel}>Total estimé</span>
                        <span className={styles.totalHours}>
                          {aiAnalysis.totalEstimatedHours}h
                        </span>
                        <span className={styles.totalCost}>
                          {aiAnalysis.totalEstimatedCost}€
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
                disabled={loading || !clientEmail}
                className={styles.downloadBtn}
                title={(!clientEmail) ? "Veuillez remplir les informations client" : ""}
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
          <div className={styles.editPopup}>
            <div className={styles.popupHeader}>
              <h3>✏️ Édition du devis</h3>
              <button
                onClick={handleCloseEditPopup}
                className={styles.popupCloseBtn}
              >
                ✕
              </button>
            </div>
            <div className={styles.popupContent}>
              {/* Édition des tâches */}
        <div className={styles.section}>
                <h4>Édition des estimations</h4>
                                 <p className={styles.helpText}>
                   Modifiez les estimations générées par l&apos;IA selon vos besoins.
                 </p>
                
                <div className={styles.tasksTable + ' ' + styles.editableTable}>
                  <div className={styles.tableHeader}>
                    <span>Tâche</span>
                    <span>Temps (h)</span>
                    <span>Coût (€)</span>
                </div>
                
                  {editedTasks.map((task, index) => (
                    <div key={index} className={`${styles.tableRow} ${task.isEdited ? styles.editedRow : ''}`}>
                      <div className={styles.taskInfo}>
                        <strong>{task.task}</strong>
                        <p className={styles.taskDescription}>{task.description}</p>
                </div>
                
                      <input
                        type="number"
                        className={styles.timeInput}
                        value={task.estimatedHours}
                        onChange={(e) => handleTaskUpdate(index, 'estimatedHours', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                      
                  <input
                        type="number"
                        className={styles.costInput}
                        value={task.estimatedCost}
                        onChange={(e) => handleTaskUpdate(index, 'estimatedCost', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                  ))}
                  
                  <div className={styles.tableTotal}>
                    <span className={styles.totalLabel}>Total estimé</span>
                    <span className={styles.totalHours}>
                      {editedTasks.reduce((sum, task) => sum + Number(task.estimatedHours || 0), 0)}h
                    </span>
                    <span className={styles.totalCost}>
                      {editedTasks.reduce((sum, task) => sum + Number(task.estimatedCost || 0), 0)}€
                    </span>
                  </div>
                </div>
                </div>
              </div>
              
            <div className={styles.popupActions}>
              <button
                onClick={handleSaveEditedQuote}
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? 'Sauvegarde...' : '💾 Sauvegarder le devis'}
              </button>
              <button
                onClick={handleCloseEditPopup}
                className={styles.closeBtn}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Affichage du devis */}
      {quoteResponse && (
        <div className={styles.quoteResult}>
          <h2>Devis généré</h2>
          
          <div className={styles.quoteActions}>
            <button 
              onClick={downloadQuoteAsPdf} 
              className={styles.downloadBtn}
            >
              Télécharger en PDF
            </button>
          </div>
          
          <div className={styles.estimates}>
            {quoteResponse.estimates.map((estimate, index) => (
              <div key={index} className={styles.estimateItem}>
                <h3>{estimate.featureName}</h3>
                
                {estimate.priceRange ? (
                  <p className={styles.price}>
                    Prix estimé: {estimate.priceRange.min}€ - {estimate.priceRange.max}€
                  </p>
                ) : (
                  <p className={styles.price}>Prix fixe: {estimate.fixedPrice}€</p>
                )}
                
                {estimate.estimatedHours && (
                  <p className={styles.hours}>
                    Temps estimé: {estimate.estimatedHours.min}h - {estimate.estimatedHours.max}h
                  </p>
                )}
                
                <p className={styles.explanation}>{estimate.explanation}</p>
              </div>
            ))}
            
            <div className={styles.total}>
              <h3>Total</h3>
              
              {quoteResponse.totalPriceRange ? (
                <p>{quoteResponse.totalPriceRange.min}€ - {quoteResponse.totalPriceRange.max}€</p>
              ) : (
                <p>{quoteResponse.totalPrice}€</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 