import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CompleteProfilePage from '../src/app/complete-profile/page';
import { completeProfile } from '@/services/profileService';
import { getUser } from '@/services/authService';
import { useRouter } from 'next/navigation';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/services/authService');
jest.mock('@/services/profileService');

describe('CompleteProfilePage', () => {
  let mockRouter;

  beforeEach(() => {
    jest.useFakeTimers(); // Utiliser les fake timers pour tous les tests de cette suite

    mockRouter = {
      push: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

    // Simuler un utilisateur non complété
    getUser.mockResolvedValue({
      id: 'user-123',
      name: 'Test User',
      isProfileCompleted: false,
    });

    completeProfile.mockResolvedValue({
      success: true,
      message: 'Profil complété avec succès',
    });
  });

  afterEach(() => {
    jest.useRealTimers(); // Restaurer les vrais timers
    jest.clearAllMocks();
  });

  it('should allow a user to fill and submit their professional profile and redirect', async () => {
    render(<CompleteProfilePage />);
    expect(await screen.findByText(/Bienvenue Test User/i)).toBeInTheDocument();

    // Remplir le formulaire
    fireEvent.change(screen.getByLabelText(/Secteur d'activité/i), {
      target: { value: 'development' },
    });

    const frontendCheckbox = await screen.findByLabelText(/Frontend/i);
    fireEvent.click(frontendCheckbox);
    
    fireEvent.change(screen.getByLabelText(/Années d'expérience/i), { target: { value: '5' } });

    // Soumettre le formulaire
    const submitButton = screen.getByRole('button', { name: /Compléter mon profil/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Vérifier l'appel API
    await waitFor(() => {
      expect(completeProfile).toHaveBeenCalledWith({
        sector: 'development',
        specialties: ['frontend'],
        yearsOfExperience: 5,
      });
    });

    // Vérifier le message de succès
    expect(await screen.findByText(/Votre profil a été complété avec succès!/i)).toBeInTheDocument();
    
    // Avancer les timers pour déclencher la redirection
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  it('should display validation errors', async () => {
    render(<CompleteProfilePage />);
    
    // Attendre que la page soit prête
    expect(await screen.findByRole('heading', { name: /Complétez votre profil/i })).toBeInTheDocument();
    
    // Simuler la soumission du formulaire pour déclencher la validation
    const form = screen.getByRole('button', { name: /Compléter mon profil/i }).closest('form');
    fireEvent.submit(form);
    
    // Attendre que l'erreur apparaisse
    await waitFor(() => {
      expect(screen.getByText(/Le secteur d'activité est requis/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
}); 