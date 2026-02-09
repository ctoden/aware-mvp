import React from 'react';
import {act, render, waitFor} from '@testing-library/react-native';
import { UserProfileScreen } from '../UserProfileScreen';
import { UserProfileViewModel } from '@src/viewModels/UserProfileViewModel';
import { DependencyService } from '@src/core/injection/DependencyService';
import { AUTH_PROVIDER_KEY } from '@src/providers/auth/AuthProvider';
import { DATA_PROVIDER_KEY } from '@src/providers/data/DataProvider';
import { TestAuthProvider } from '@src/providers/auth/__tests__/TestAuthProvider';
import { TestDataProvider } from '@src/providers/data/__tests__/TestDataProvider';
import { AuthService } from '@src/services/AuthService';
import { DataService } from '@src/services/DataService';
import { UserProfileService } from '@src/services/UserProfileService';
import { userProfile$ } from '@src/models/UserProfile';
import { session$, user$ } from '@src/models/SessionModel';
import { withViewModel } from '@src/viewModels/ViewModel';
import { nanoid } from 'nanoid';
import { container } from 'tsyringe';

describe('UserProfileScreen', () => {
  let viewModel: UserProfileViewModel;
  let testAuthProvider: TestAuthProvider;
  let testDataProvider: TestDataProvider;
  let authService: AuthService;
  let dataService: DataService;
  let userProfileService: UserProfileService;

  const mockProfile = {
    id: 'test-user-id',
    full_name: 'Kate Smith',
    phone_number: '+1234567890',
    avatar_url: null,
    summary: 'You are a truly independent and inquisitive person...',
    website: null,
    updated_at: null,
    family_story: null,
    primary_occupation: null,
    birth_date: null
  };

  beforeEach(async () => {
    // Reset observables
    session$.set(null);
    user$.set(null);
    userProfile$.set(null);

    // Setup providers and register them
    testAuthProvider = new TestAuthProvider();
    testDataProvider = new TestDataProvider();
    await testAuthProvider.initialize();
    await testDataProvider.initialize();

    DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
    DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);

    // Setup services
    authService = new AuthService();
    dataService = new DataService();
    userProfileService = new UserProfileService();
    await authService.initialize();
    await dataService.initialize();
    await userProfileService.initialize();

    // Setup test data
    testDataProvider.setTestData('user_profiles', [mockProfile]);

    // Create and initialize view model
    viewModel = await withViewModel(UserProfileViewModel, nanoid(5));
    
    // Initialize the viewModel's observables with mock data
    userProfile$.set(mockProfile);

    // Register the viewModel instance with the container
    container.registerInstance(UserProfileViewModel, viewModel);
  });

  afterEach(async () => {
    await viewModel.end();
    await userProfileService.end();
    await dataService.end();
    await authService.end();
    await testDataProvider.end();
    await testAuthProvider.end();
    
    // Reset observables
    session$.set(null);
    user$.set(null);
    userProfile$.set(null);
    // Clear the container registration
    container.clearInstances();
  });

  it('renders loading state when not initialized', async () => {
    // Force viewModel to be uninitialized for this test
    const uninitializedViewModel = new UserProfileViewModel();
    // Clear the profile data for this test
    userProfile$.set(null);
    container.registerInstance(UserProfileViewModel, uninitializedViewModel);

    const { getByText } = render(<UserProfileScreen />);
    await waitFor(() => {
      expect(getByText('Loading...')).toBeTruthy();
    });
  });

  it('renders user profile when authenticated', async () => {
    testAuthProvider.setSession({
      access_token: 'test_token',
      user: { id: 'test-user-id', email: 'test@example.com' }
    });

    // Ensure profile data is set
    userProfile$.set(mockProfile);
    
    const { getByText } = render(<UserProfileScreen />);
    await waitFor(() => {
      expect(getByText('Kate Smith')).toBeTruthy();
      expect(getByText('You are a truly independent and inquisitive person...')).toBeTruthy();
    });
  });


  it('renders default avatar when no avatar URL is provided', async () => {
    testAuthProvider.setSession({
      access_token: 'test_token',
      user: { id: 'test-user-id', email: 'test@example.com' }
    });

    // Ensure profile data is set with null avatar_url
    userProfile$.set({...mockProfile, avatar_url: null});

    const { getByTestId } = render(<UserProfileScreen />);
    await waitFor(() => {
      const defaultAvatar = getByTestId('default-avatar-icon');
      expect(defaultAvatar).toBeTruthy();
    });
  });

  it('renders avatar image when URL is provided', async () => {
    const profileWithAvatar = {
      ...mockProfile,
      avatar_url: 'https://example.com/avatar.jpg'
    };
    
    // Set up profile with avatar URL
    userProfile$.set(profileWithAvatar);

    testAuthProvider.setSession({
      access_token: 'test_token',
      user: { id: 'test-user-id', email: 'test@example.com' }
    });

    const { getByTestId } = render(<UserProfileScreen />);
    await waitFor(() => {
      const avatar = getByTestId('profile-avatar-image');
      expect(avatar).toBeTruthy();
    });
  });

  it('handles profile updates', async () => {
    testAuthProvider.setSession({
      access_token: 'test_token',
      user: { id: 'test-user-id', email: 'test@example.com' }
    });

    // Set initial profile
    userProfile$.set(mockProfile);

    // Update profile
    const updatedProfile = {
      ...mockProfile,
      full_name: 'Updated Name'
    };
    userProfile$.set(updatedProfile);

    const { getByText } = render(<UserProfileScreen />);
    await waitFor(() => {
      expect(getByText('Updated Name')).toBeTruthy();
    });
  });
});