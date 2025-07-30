import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthForm from '../src/components/AuthForm';
import { authService } from '@/utils/api';
import { useRouter } from 'next/navigation';

// Simuler les modules externes
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/utils/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

describe('AuthForm', () => {
  let mockRouter;
  const originalLocation = window.location;

  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(), // Ajout de replace pour la redirection
    };
    useRouter.mockReturnValue(mockRouter);
    
    // Remplacer la simulation de window.location par une qui est plus sûre
    delete window.location;
    window.location = Object.defineProperties(
      {},
      {
        ...Object.getOwnPropertyDescriptors(originalLocation),
        assign: {
          configurable: true,
          value: jest.fn(),
        },
        replace: { // Ajout de replace pour la redirection
          configurable: true,
          value: jest.fn(),
        }
      },
    );
  });

  afterEach(() => {
    // Restaurer l'original
    window.location = originalLocation;
    jest.clearAllMocks();
  });

  it('should handle successful login and redirect', async () => {
    authService.login.mockResolvedValue({ token: 'fake-token', user: { isProfileCompleted: true } });
    render(<AuthForm />);
    
    fireEvent.change(screen.getByPlaceholderText(/Votre email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Votre mot de passe/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      // Vérifier l'URL complète
      expect(window.location.href).toBe('http://localhost/');
    });
  });

  it('should handle failed login and display error message', async () => {
    render(<AuthForm />);

    const errorMessage = 'Email ou mot de passe incorrect';
    authService.login.mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    // Attendre que le message d'erreur s'affiche
    expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  });

  it('should switch to registration form and handle successful registration', async () => {
    render(<AuthForm />);

    // Passer en mode inscription
    fireEvent.click(screen.getByRole('button', { name: /créer un compte/i }));
    
    expect(screen.getByRole('heading', { name: /inscription/i })).toBeInTheDocument();

    authService.register.mockResolvedValue({
      token: 'new-fake-token',
      user: { id: 'new-user' },
    });

    // Remplir le formulaire d'inscription
    fireEvent.change(screen.getByLabelText(/nom/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirmer le mot de passe/i), { target: { value: 'password123' } });
    
    // Soumettre
    fireEvent.click(screen.getByRole('button', { name: /s'inscrire/i }));

    // Attendre le message de succès et la redirection
    expect(await screen.findByText(/Votre compte a été créé avec succès!/i)).toBeInTheDocument();
    await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/complete-profile');
    }, { timeout: 4000 }); // Augmenter le timeout pour le `setTimeout` du code
  });

  it('should show an error if passwords do not match on registration', async () => {
    render(<AuthForm />);
    
    // Utiliser le bon texte pour changer de vue
    fireEvent.click(screen.getByRole('button', { name: /Créer un compte/i }));
    
    // Attendre que le formulaire d'inscription s'affiche
    await screen.findByRole('heading', { name: /Inscription/i });

    fireEvent.change(screen.getByPlaceholderText(/Votre nom/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByPlaceholderText(/Votre email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Votre mot de passe'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByPlaceholderText(/Confirmez votre mot de passe/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }));

    expect(await screen.findByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument();
  });
}); 