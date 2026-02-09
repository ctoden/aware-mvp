import React from 'react';
import {act, fireEvent, render, waitFor} from '@testing-library/react-native';
import SignInScreen from '@app/screens/SignInScreen';
import {useViewModel} from '@src/hooks/useViewModel';
import {useRouter} from 'expo-router';
import {createMockObservable} from "@src/__tests__/createMockObservable";

// Mock dependencies
jest.mock('@src/hooks/useViewModel');
// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn()
}));
describe('SignInScreen', () => {
  const mockSignIn = jest.fn();
  const mockViewModel = {
    email$: createMockObservable(""),
    password$: createMockObservable(""),
    error$: createMockObservable<string | null>(null),//{ get: jest.fn().mockReturnValue(null) },
    isLoading$: createMockObservable(false),
    signIn: mockSignIn,
  };

  const mockNavigation = {
    navigate: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    (useViewModel as jest.Mock).mockReturnValue({
      viewModel: mockViewModel,
      isInitialized: true,
      error: null,
    });

    (useRouter as jest.Mock).mockReturnValue(mockNavigation);
  });

  it('renders sign in screen correctly', () => {
    const { getByPlaceholderText, getByText } = render(<SignInScreen />);

    // Check if input fields are present
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    
    // Check if Sign In button is present
    expect(getByText('Sign In')).toBeTruthy();
  });

  it('updates email and password when text is entered', () => {
    const { getByPlaceholderText } = render(<SignInScreen />);

    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Password');

    act(() => {
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
    })

    expect(mockViewModel.email$.set).toHaveBeenCalledWith('test@example.com');
    expect(mockViewModel.password$.set).toHaveBeenCalledWith('password123');
  });

  it('calls signIn when Sign In button is pressed', async () => {
    const { getByText } = render(<SignInScreen />);

    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('navigates to SignUp screen when link is pressed', () => {
    const { getByText } = render(<SignInScreen />);

    const signUpLink = getByText("Don't have an account? Sign Up");
    fireEvent.press(signUpLink);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('SignUp');
  });

  it('displays loading indicator when loading', () => {
    (mockViewModel.isLoading$.get as jest.Mock).mockReturnValue(true);

    const { getByTestId } = render(<SignInScreen />);

    // Assuming ActivityIndicator has a testID or using a more specific query
    const loadingIndicator = getByTestId('loading-indicator');
    expect(loadingIndicator).toBeTruthy();
  });

  it('displays error message when error exists', () => {
    const errorMessage = 'Invalid credentials';
    (mockViewModel.error$.get as jest.Mock).mockReturnValue(errorMessage);

    const { getByText } = render(<SignInScreen />);

    expect(getByText(errorMessage)).toBeTruthy();
  });

  it.skip('handles view model initialization error', () => {
    const initializationError = new Error('Initialization failed');
    (useViewModel as jest.Mock).mockReturnValue({
      viewModel: null,
      isInitialized: false,
      error: initializationError,
    });

    const { getByText } = render(<SignInScreen />);

    expect(getByText(`Error loading sign in screen: ${initializationError.message}`)).toBeTruthy();
  });
}); 