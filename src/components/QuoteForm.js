'use client';

import { useState } from 'react';
// import { iaService } from '@/utils/api';
import styles from '../styles/QuoteForm.module.css';

export default function QuoteForm({ user }) {
  const [loading, setLoading] = useState(false);
  const [quoteResponse, setQuoteResponse] = useState(null);
  
  const [developer, setDeveloper] = useState({
    experience: 0,
    skills: [],
    hourlyRate: ''
  });
  
  const [features, setFeatures] = useState([]);

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
      const quoteRequest = {
        developer,
        features,
        isSubscribed: user?.isSubscribed || false,
      };
      
      const response = await iaService.generateQuote({
        quoteRequest,
        email: user?.email
      });
      
      setQuoteResponse(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la génération du devis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Générateur de devis IA</h1>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Section profil développeur */}
        <div className={styles.section}>
          <h2>Profil du développeur</h2>
          
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