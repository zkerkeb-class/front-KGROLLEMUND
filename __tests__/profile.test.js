import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProfilePage from '../src/app/profile/page';
import { verify } from '@/services/authService';
import { dbAPI } from '@/services/axiosConfig';
import { subscriptionService } from '@/services/subscriptionService';
import { useRouter } from 'next/navigation';

// Simuler les modules et services externes
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/services/authService', () => ({
  verify: jest.fn(),
}));

jest.mock('@/services/axiosConfig', () => ({
  dbAPI: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

jest.mock('@/services/subscriptionService', () => ({
  subscriptionService: {
    checkSubscriptionStatus: jest.fn(),
    cancelSubscription: jest.fn(),
  },
}));

describe('ProfilePage', () => {
  let mockRouter;
  
  // Données utilisateur simulées
  const mockUserSubscribed = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    isSubscribed: true,
    subscriptionEndDate: '2025-12-31T23:59:59.000Z',
    subscriptionId: 'sub_123' // Ajout de cette information cruciale
  };
  
  const mockProfile = {
    sector: 'development',
    specialties: ['react', 'node'],
    yearsOfExperience: 5,
  };

  const originalLocation = window.location;

  beforeEach(() => {
    // Initialiser le router mock
    mockRouter = {
      push: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);
    
    // Simuler un token dans localStorage pour que la page ne redirige pas
    Storage.prototype.getItem = jest.fn((key) => {
        if (key === 'token') return 'fake-token';
        return null;
    });
    
    // Simuler la réponse de l'API de vérification
    verify.mockResolvedValue({
      data: { user: mockUserSubscribed },
    });

    // Simuler la réponse de l'API du profil
    dbAPI.get.mockResolvedValue({ data: mockProfile });
    
    // Simuler la réponse pour l'annulation d'abonnement
    subscriptionService.cancelSubscription.mockResolvedValue({
      success: true,
    });

    delete window.location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(originalLocation),
        reload: { configurable: true, value: jest.fn() },
      },
    );
  });
  
  afterEach(() => {
    window.location = originalLocation;
    jest.clearAllMocks();
    Storage.prototype.getItem.mockClear();
  });

  it('should display subscription status for a subscribed user with a profile', async () => {
    render(<ProfilePage />);

    // Utiliser une expression régulière pour trouver la date, peu importe le format
    expect(await screen.findByText(/(\d{1,2}\/\d{1,2}\/\d{4})/)).toBeInTheDocument();
    
    // Vérifier le reste
    expect(screen.getByText(/Active/i)).toBeInTheDocument();
  });

  it('should allow a subscribed user to unsubscribe', async () => {
    render(<ProfilePage />);

    // Attendre que la page soit chargée et que le bouton soit disponible
    const unsubscribeButton = await screen.findByRole('button', { name: /Se désabonner/i });
    fireEvent.click(unsubscribeButton);

    const confirmButton = await screen.findByRole('button', { name: /Confirmer/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith('sub_123');
    });
  });

  it('should display the profile creation form for a user without a profile', async () => {
    // Surcharger le mock pour ce test spécifique: dbAPI échoue
    dbAPI.get.mockRejectedValue(new Error('No profile found'));
    
    render(<ProfilePage />);

    // Attendre que le titre du formulaire de profil s'affiche
    expect(await screen.findByRole('heading', { name: /Votre profil développeur/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Secteur d'activité/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Années d'expérience/i)).toBeInTheDocument();
  });
}); 