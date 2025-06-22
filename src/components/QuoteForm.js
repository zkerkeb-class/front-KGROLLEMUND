'use client';

import { useState, useRef } from 'react';
import { iaAPI, dbAPI } from '@/services/axiosConfig';
import styles from '../styles/QuoteForm.module.css';

export default function QuoteForm({ user }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [quoteResponse, setQuoteResponse] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  
  const [developer, setDeveloper] = useState({
    experience: user?.developerProfile?.yearsOfExperience || 0,
    skills: user?.developerProfile?.skills || [],
    hourlyRate: user?.developerProfile?.hourlyRate || ''
  });
  
  const [features, setFeatures] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Fonction pour gérer l'upload de fichier
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFile(file);
      
      // Reset de l'analyse si un nouveau fichier est chargé
      setAiAnalysis(null);
    }
  };

  // Fonction pour analyser le fichier
  const analyzeFile = async () => {
    if (!uploadedFile) {
      alert('Veuillez d&apos;abord télécharger un fichier');
      return;
    }

    setAnalyzing(true);
    
    try {
      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('file', uploadedFile);
      
      // Ajouter des métadonnées sur l'utilisateur pour améliorer l'analyse
      if (user?.developerProfile) {
        formData.append('developerSpecialty', user.developerProfile.specialty);
        formData.append('developerExperience', user.developerProfile.yearsOfExperience);
      }
      
      // Appel à l'API d'analyse
      const response = await iaAPI.post('/analyze-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Récupérer les résultats de l'analyse
      const analysisResult = response.data;
      setAiAnalysis(analysisResult);
      
      // Pré-remplir les fonctionnalités détectées
      if (analysisResult.detectedFeatures && analysisResult.detectedFeatures.length > 0) {
        setFeatures(analysisResult.detectedFeatures.map(feature => ({
          name: feature.name,
          description: feature.description,
          complexity: feature.complexity || 'medium',
          technologies: feature.technologies || [],
        })));
      }
      
      // Pré-remplir le titre et la description si détectés
      if (analysisResult.title) {
        setTitle(analysisResult.title);
      }
      
      if (analysisResult.description) {
        setDescription(analysisResult.description);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse du fichier:', error);
      alert('Une erreur est survenue lors de l\'analyse du fichier');
    } finally {
      setAnalyzing(false);
    }
  };

  // Fonction pour ajouter une nouvelle fonctionnalité
  const addFeature = () => {
    setFeatures([
      ...features,
      {
        name: '',
        description: '',
        complexity: 'medium',
        technologies: [],
      },
    ]);
  };
  
  // Fonction pour mettre à jour une fonctionnalité
  const updateFeature = (index, updatedFeature) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], ...updatedFeature };
    setFeatures(newFeatures);
  };
  
  // Fonction pour soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Création de la demande de devis
      const quoteRequest = {
        title,
        description,
        developer: {
          ...developer,
          specialty: user?.developerProfile?.specialty || '',
        },
        features,
        isSubscribed: user?.isSubscribed || false,
      };
      
      // Si on a une analyse IA, l'inclure dans la demande
      if (aiAnalysis) {
        quoteRequest.aiAnalysis = aiAnalysis;
      }
      
      // Envoi de la demande au service IA
      const iaResponse = await iaAPI.post('/quote', {
        quoteRequest,
        email: user?.email
      });
      
      // Enregistrement de la demande dans la base de données
      try {
        await dbAPI.post('/quote-requests', {
          userId: user.id,
          title,
          description,
          features: JSON.stringify(features),
          documentType: uploadedFile ? uploadedFile.type : null,
          aiAnalysis: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
          totalEstimate: iaResponse.data.totalPrice || iaResponse.data.totalPriceRange?.max,
          status: 'completed'
        });
      } catch (dbError) {
        console.error('Erreur lors de l\'enregistrement du devis:', dbError);
        // On continue même si l'enregistrement échoue
      }
      
      setQuoteResponse(iaResponse.data);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la génération du devis');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour télécharger le devis en PDF
  const downloadQuoteAsPdf = () => {
    if (!quoteResponse) return;
    
    // Ici, implémenter la génération PDF du devis
    alert('Fonctionnalité de téléchargement en PDF à implémenter');
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Générateur de devis IA</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Section informations générales */}
        <div className={styles.section}>
          <h2>Informations générales</h2>
          
          <div className={styles.formGroup + ' ' + styles.fullWidth}>
            <label>Titre du projet</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Développement d'une application web e-commerce"
            />
          </div>
          
          <div className={styles.formGroup + ' ' + styles.fullWidth}>
            <label>Description du projet</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
              placeholder="Décrivez brièvement votre projet et vos besoins"
            />
          </div>
        </div>
        
        {/* Section upload et analyse de document */}
        <div className={styles.section}>
          <h2>Analyse de cahier des charges</h2>
          <p className={styles.helpText}>
            Téléchargez un document (PDF, DOCX, PNG) contenant votre cahier des charges ou vos spécifications pour une analyse automatique.
          </p>
          
          <div className={styles.fileUploadContainer}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className={styles.fileInput}
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
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
              </div>
            )}
          </div>
          
          {aiAnalysis && (
            <div className={styles.analysisResult}>
              <h3>Résultats de l'analyse</h3>
              
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
            </div>
          )}
        </div>
        
        {/* Section profil développeur */}
        <div className={styles.section}>
          <h2>Profil du développeur</h2>
          
          {!user?.developerProfile && (
            <div className={styles.profileWarning}>
              <p>
                Vous n&apos;avez pas encore complété votre profil développeur. 
                <a href="/profile" className={styles.profileLink}>Compléter mon profil</a> 
                pour obtenir un devis plus précis.
              </p>
            </div>
          )}
          
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>Années d&apos;expérience</label>
              <input
                type="number"
                min="0"
                value={developer.experience}
                onChange={(e) => setDeveloper({ ...developer, experience: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Compétences (séparées par des virgules)</label>
              <input
                type="text"
                value={developer.skills.join(', ')}
                onChange={(e) => setDeveloper({ ...developer, skills: e.target.value.split(',').map(s => s.trim()) })}
                placeholder="React, Node.js, TypeScript..."
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Taux horaire (optionnel)</label>
              <input
                type="number"
                min="0"
                value={developer.hourlyRate}
                onChange={(e) => setDeveloper({ ...developer, hourlyRate: e.target.value ? parseInt(e.target.value) : '' })}
                placeholder="€/h"
              />
            </div>
          </div>
        </div>
        
        {/* Section fonctionnalités */}
        <div className={styles.section}>
          <h2>Fonctionnalités à développer</h2>
          
          {features.map((feature, index) => (
            <div key={index} className={styles.feature}>
              <h3>Fonctionnalité {index + 1}</h3>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nom</label>
                  <input
                    type="text"
                    value={feature.name}
                    onChange={(e) => updateFeature(index, { name: e.target.value })}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Complexité</label>
                  <select
                    value={feature.complexity}
                    onChange={(e) => updateFeature(index, { complexity: e.target.value })}
                    required
                  >
                    <option value="simple">Simple</option>
                    <option value="medium">Moyenne</option>
                    <option value="complex">Complexe</option>
                  </select>
                </div>
                
                <div className={styles.formGroup + ' ' + styles.fullWidth}>
                  <label>Description</label>
                  <textarea
                    value={feature.description}
                    onChange={(e) => updateFeature(index, { description: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
                
                <div className={styles.formGroup + ' ' + styles.fullWidth}>
                  <label>Technologies (séparées par des virgules)</label>
                  <input
                    type="text"
                    value={feature.technologies.join(', ')}
                    onChange={(e) => updateFeature(index, { technologies: e.target.value.split(',').map(t => t.trim()) })}
                    placeholder="React, API REST, MongoDB..."
                    required
                  />
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setFeatures(features.filter((_, i) => i !== index))}
                className={styles.removeBtn}
              >
                Supprimer
              </button>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addFeature}
            className={styles.addBtn}
          >
            Ajouter une fonctionnalité
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading || features.length === 0}
          className={styles.submitBtn}
        >
          {loading ? 'Génération en cours...' : 'Générer le devis'}
        </button>
      </form>
      
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