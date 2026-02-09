import React from 'react';
import {fireEvent, render, waitFor} from '@testing-library/react-native';
import SignUpScreen from '../SignUpScreen';
import {SignUpViewModel} from '@src/viewModels/SignUpViewModel';
import {DependencyService} from '@src/core/injection/DependencyService';
import {AUTH_PROVIDER_KEY} from '@src/providers/auth/AuthProvider';
import {TestAuthProvider} from '@src/providers/auth/__tests__/TestAuthProvider';
import {AuthService} from '@src/services/AuthService';
import {session$, user$} from '@src/models/SessionModel';
import {withViewModel} from '@src/viewModels/ViewModel';
import {nanoid} from 'nanoid';
import {container} from 'tsyringe';
import {useRouter} from 'expo-router';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn()
}));

describe('SignUpScreen', () => {
  let viewModel: SignUpViewModel;
  let testAuthProvider: TestAuthProvider;
  let authService: AuthService;
  let mockNavigation: { navigate: jest.Mock };

  beforeEach(async () => {
    // Reset auth models
    session$.set(null);
    user$.set(null);

    // Setup test auth provider
    testAuthProvider = new TestAuthProvider();
    await testAuthProvider.initialize();
    DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);

    // Setup auth service
    authService = new AuthService();
    await authService.initialize();

    // Setup view model
    viewModel = await withViewModel(SignUpViewModel, nanoid(5));

    // Register the viewModel instance with the container
    container.registerInstance(SignUpViewModel, viewModel);

    // Setup mock navigation
    mockNavigation = {
      navigate: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockNavigation);
  });

  afterEach(async () => {
    await viewModel.end();
    await authService.end();
    await testAuthProvider.end();
    
    // Reset observables
    session$.set(null);
    user$.set(null);
    // Clear the container registration
    container.clearInstances();
  });

  it('renders loading state when not initialized', async () => {
    // Force viewModel to be uninitialized for this test
    const uninitializedViewModel = new SignUpViewModel();
    container.registerInstance(SignUpViewModel, uninitializedViewModel);

    const rendered = render(<SignUpScreen />);
    await waitFor(() => {
      expect(rendered.getByText('Loading...')).toBeTruthy();
    });
  });

  it('renders sign up form when initialized', async () => {
    const rendered = render(<><SignUpScreen /></>);

    // rendered.debug();
    // Wait for initialization
    await waitFor(() => {
      expect(rendered.getByTestId('email-input')).toBeTruthy();
      expect(rendered.getByTestId('password-input')).toBeTruthy();
      expect(rendered.getByTestId('confirm-password-input')).toBeTruthy();
      expect(rendered.getByTestId('sign-up-button')).toBeTruthy();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // rendered.debug();

    // await new Promise(resolve => setTimeout(resolve, 2000));
    //
    // await waitFor(() => {
    //   expect(getByTestId('email-input')).toBeTruthy();
      // expect(rendered.getByPlaceholderText('Password')).toBeTruthy();
      // expect(rendered.getByPlaceholderText('Confirm Password')).toBeTruthy();
      // expect(rendered.getByText('Sign Up')).toBeTruthy();
    // });
  }, 5000);

  it('validates email format', async () => {
    const rendered = render(<SignUpScreen />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(rendered.queryByText('Loading...')).toBeNull();
    });

    const emailInput = rendered.getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent(emailInput, 'blur');

    await waitFor(() => {
      expect(rendered.getByText('Please enter a valid email address')).toBeTruthy();
    });
  });

  it('validates password match', async () => {
    const rendered = render(<SignUpScreen />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(rendered.queryByText('Loading...')).toBeNull();
    });

    const passwordInput = rendered.getByPlaceholderText('Password');
    const confirmPasswordInput = rendered.getByPlaceholderText('Confirm Password');

    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.changeText(confirmPasswordInput, 'password456');
    fireEvent(confirmPasswordInput, 'blur');

    await waitFor(() => {
      expect(rendered.getByText('Passwords do not match')).toBeTruthy();
    });
  });

  it('shows loading indicator during sign up', async () => {
    const rendered = render(<SignUpScreen />);

    // Wait for initialization
    await waitFor(() => {
      expect(rendered.queryByText('Loading...')).toBeNull();
    });

    // Fill in valid form data
    fireEvent.changeText(rendered.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(rendered.getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(rendered.getByPlaceholderText('Confirm Password'), 'password123');

    // Trigger sign up
    fireEvent.press(rendered.getByText('Sign Up'));

    await waitFor(() => {
      expect(rendered.getByTestId('loading-indicator')).toBeTruthy();
    });
  });

  it('navigates to sign in screen when link is pressed', async () => {
    const rendered = render(<SignUpScreen />);

    // Wait for initialization
    await waitFor(() => {
      expect(rendered.queryByText('Loading...')).toBeNull();
    });

    fireEvent.press(rendered.getByText('Already have an account? Sign In'));

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('SignIn');
    });
  });

  it('handles successful sign up', async () => {
    const rendered = render(<SignUpScreen />);

    // Wait for initialization
    await waitFor(() => {
      expect(rendered.queryByText('Loading...')).toBeNull();
    });

    // Fill in valid form data
    fireEvent.changeText(rendered.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(rendered.getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(rendered.getByPlaceholderText('Confirm Password'), 'password123');

    // Trigger sign up
    fireEvent.press(rendered.getByText('Sign Up'));

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays view model error when sign up fails', async () => {
    const rendered = render(<SignUpScreen />);

    // Wait for initialization
    await waitFor(() => {
      expect(rendered.queryByText('Loading...')).toBeNull();
    });

    // Fill in valid form data
    fireEvent.changeText(rendered.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(rendered.getByPlaceholderText('Password'), 'password123');
    fireEvent.changeText(rendered.getByPlaceholderText('Confirm Password'), '123password123');

    // Trigger sign up
    fireEvent.press(rendered.getByText('Sign Up'));

    await waitFor(() => {
      expect(rendered.getByTestId('error-message')).toBeTruthy();
    })

  });
}); 