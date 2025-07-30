import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import QuoteForm from '../src/components/QuoteForm';
import { uploadDocumentForAnalysis } from '@/services/iaService';
import { getUserProfile } from '@/services/profileService';

// Simuler les modules externes
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
jest.mock('@/services/iaService', () => ({
  uploadDocumentForAnalysis: jest.fn(),
}));
jest.mock('@/services/profileService', () => ({
  getUserProfile: jest.fn(),
}));

describe('QuoteForm', () => {
  const mockUser = { id: 'user-123', isSubscribed: true };

  beforeEach(() => {
    // Mock global pour window.alert
    global.alert = jest.fn();
    
    // Simuler un profil utilisateur résolu
    getUserProfile.mockResolvedValue({
      sector: 'development',
      specialties: ['frontend', 'backend'],
      yearsOfExperience: 5,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow a user to fill the form, upload a file, and get an analysis', async () => {
    // Simuler une analyse réussie
    uploadDocumentForAnalysis.mockResolvedValue({ 
      success: true,
      message: 'Analyse terminée !',
      data: { quoteRequestId: 'quote123' }
    });

    render(<QuoteForm user={mockUser} />);
    
    // Attendre le chargement du profil
    expect(await screen.findByText(/Mon profil/i)).toBeInTheDocument();

    // Remplir les informations
    fireEvent.change(screen.getByPlaceholderText(/Ex: Développement d'une application web e-commerce/i), { target: { value: 'My Test Project' } });
    fireEvent.change(screen.getByPlaceholderText(/Décrivez brièvement le\/les besoins du client/i), { target: { value: 'A simple test project.' } });
    fireEvent.change(screen.getByPlaceholderText(/Nom de l'entreprise ou de la personne/i), { target: { value: 'Test Client' } });
    fireEvent.change(screen.getByPlaceholderText(/email@entreprise.com/i), { target: { value: 'client@test.com' } });

    // Sélection directe de l'input de fichier par sa classe
    const file = new File(['(⌐□_□)'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"].fileInput');
    fireEvent.change(fileInput, { target: { files: [file] } });

    const analyzeButton = await screen.findByRole('button', { name: /Analyser le document/i });
    fireEvent.click(analyzeButton);

    // Attendre le message de succès
    await waitFor(() => {
      expect(screen.getByText(/Analyse terminée !/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should show an alert if trying to analyze without filling required fields', async () => {
    render(<QuoteForm user={mockUser} />);
    
    // Attendre le chargement du profil
    expect(await screen.findByText(/Mon profil/i)).toBeInTheDocument();

    // Simuler le téléchargement d'un fichier avec un sélecteur direct
    const file = new File(['(⌐□_□)'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"].fileInput');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const analyzeButton = await screen.findByRole('button', { name: /Analyser le document/i });
    fireEvent.click(analyzeButton);
    
    // Vérifier que l'alert global a été appelé
    expect(global.alert).toHaveBeenCalledWith('Veuillez renseigner le titre, la description du projet et les informations client avant l\'analyse');
  });
}); 