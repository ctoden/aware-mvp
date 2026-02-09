import { UserProfileViewModel } from '../UserProfileViewModel';
import { userProfile$ } from '@src/models/UserProfile';
import { user$ } from '@src/models/SessionModel';
import { container } from 'tsyringe';
import { AuthService } from '@src/services/AuthService';
import { TestAuthProvider } from '@src/providers/auth/__tests__/TestAuthProvider';
import { AUTH_PROVIDER_KEY } from '@src/providers/auth/AuthProvider';
import { DependencyService } from '@src/core/injection/DependencyService';
import { GenerateDataService } from '@src/services/GenerateDataService';
import { ChangeEvent, ChangeType, emitChange } from '@src/events/ChangeEvent';

describe('UserProfileViewModel', () => {
    let viewModel: UserProfileViewModel;
    let authService: AuthService;
    let testAuthProvider: TestAuthProvider;
    let generateDataService: GenerateDataService;

    beforeEach(async () => {
        // Reset observables
        userProfile$.set(null);
        user$.set(null);

        // Create and initialize the test provider
        testAuthProvider = new TestAuthProvider();
        await testAuthProvider.initialize();
        
        // Register the provider
        DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
        
        // Create and initialize the auth service
        authService = new AuthService();
        await authService.initialize();

        // Create and initialize the generate data service
        generateDataService = new GenerateDataService();
        await generateDataService.initialize();

        // Emit APP_INIT_DONE to allow GenerateDataService to process events
        emitChange(ChangeType.APP_INIT_DONE, null, 'system');

        // Register services
        container.registerInstance(AuthService, authService);
        container.registerInstance(GenerateDataService, generateDataService);

        // Create view model instance
        viewModel = new UserProfileViewModel();
        await viewModel.initialize();
    });

    afterEach(async () => {
        await viewModel.end();
        await authService.end();
        await generateDataService.end();
        await testAuthProvider.end();
        container.clearInstances();
    });

    describe('initialization', () => {
        it('should initialize with empty form state', async () => {
            const result = await (viewModel as any).onInitialize?.();
            expect(result?.isOk()).toBe(true);
            expect(viewModel.formState$.get()).toEqual({
                fullName: '',
                phoneNumber: '',
                birthDate: null,
                email: '',
            });
        });

        it('should initialize form state from existing profile', async () => {
            const mockProfile = {
                id: '123',
                full_name: 'Test User',
                username: 'testuser',
                phone_number: '+1234567890',
                birth_date: new Date('1990-01-01'),
                avatar_url: null,
                website: null,
                summary: null,
                updated_at: new Date().toISOString(),
                family_story: null,
                primary_occupation: null
            };
            userProfile$.set(mockProfile);

            const result = await (viewModel as any).onInitialize?.();
            expect(result?.isOk()).toBe(true);
            expect(viewModel.formState$.get()).toEqual({
                fullName: 'Test User',
                phoneNumber: '+1234567890',
                birthDate: new Date('1990-01-01'),
                email: '',
            });
        });
    });

    describe('saveProfile', () => {
        it('should save profile with phone number and birth date', async () => {
            // Setup
            await authService.signIn('test@example.com', 'password');
            viewModel.formState$.set({
                fullName: 'New Name',
                phoneNumber: '+1987654321',
                birthDate: new Date('1990-01-01'),
                email: 'test@example.com',
            });

            // Act
            const result = await viewModel.saveProfile();

            // Assert
            expect(result.isOk()).toBe(true);
            const savedProfile = userProfile$.get();
            expect(savedProfile).toMatchObject({
                id: 'test_user_id',
                full_name: 'New Name',
                phone_number: '+1987654321',
                birth_date: '1990-01-01',
            });
        });

        it('should fail to save profile when user is not logged in', async () => {
            // Setup
            viewModel.formState$.set({
                fullName: 'New Name',
                phoneNumber: '+1987654321',
                birthDate: new Date('1990-01-01'),
                email: '',
            });

            // Act
            const result = await viewModel.saveProfile();

            // Assert
            expect(result.isErr()).toBe(true);
            expect(result._unsafeUnwrapErr().message).toBe('No user logged in');
        });
    });

    describe('profile actions progress', () => {
        it('should detect LOGIN actions in progress', async () => {
            // Setup - manually manipulate the GenerateDataService progress state
            const progressId = `${ChangeType.LOGIN}_${Date.now()}`;
            
            // Mock a running LOGIN action
            generateDataService.generationProgress$.set({
                [progressId]: {
                    id: progressId,
                    status: 'running',
                    startTime: Date.now(),
                    totalActions: 1,
                    completedActions: 0,
                    actionProgress: {
                        'TestAction': {
                            actionName: 'TestAction',
                            status: 'started',
                            timestamp: Date.now()
                        }
                    }
                }
            });

            // Act
            await viewModel.checkProfileActionsProgress();

            // Assert
            expect(viewModel.isLoginActionsInProgress$.get()).toBe(true);
            expect(viewModel.isProfileDataLoading$.get()).toBe(false);

            // Update the progress to completed
            generateDataService.generationProgress$.set({
                [progressId]: {
                    id: progressId,
                    status: 'completed',
                    startTime: Date.now() - 1000, // 1 second ago
                    endTime: Date.now(),
                    totalActions: 1,
                    completedActions: 1,
                    actionProgress: {
                        'TestAction': {
                            actionName: 'TestAction',
                            status: 'completed',
                            timestamp: Date.now()
                        }
                    }
                }
            });

            // Act again
            await viewModel.checkProfileActionsProgress();

            // Assert
            expect(viewModel.isLoginActionsInProgress$.get()).toBe(false);
        });

        it('should detect PROFILE actions in progress', async () => {
            // Setup - manually manipulate the GenerateDataService progress state
            const progressId = `${ChangeType.USER_PROFILE_REFRESH}_${Date.now()}`;
            
            // Mock a running PROFILE_REFRESH action
            generateDataService.generationProgress$.set({
                [progressId]: {
                    id: progressId,
                    status: 'running',
                    startTime: Date.now(),
                    totalActions: 1,
                    completedActions: 0,
                    actionProgress: {
                        'ProfileRefreshAction': {
                            actionName: 'ProfileRefreshAction',
                            status: 'started',
                            timestamp: Date.now()
                        }
                    }
                }
            });

            // Act
            await viewModel.checkProfileActionsProgress();

            // Assert
            expect(viewModel.isLoginActionsInProgress$.get()).toBe(false);
            expect(viewModel.isProfileDataLoading$.get()).toBe(true);

            // Update the progress to completed
            generateDataService.generationProgress$.set({
                [progressId]: {
                    id: progressId,
                    status: 'completed',
                    startTime: Date.now() - 1000, // 1 second ago
                    endTime: Date.now(),
                    totalActions: 1,
                    completedActions: 1,
                    actionProgress: {
                        'ProfileRefreshAction': {
                            actionName: 'ProfileRefreshAction',
                            status: 'completed',
                            timestamp: Date.now()
                        }
                    }
                }
            });

            // Set a user ID to mock being logged in
            user$.set({
                id: 'test_id',
                email: 'test@example.com',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            });
            
            // Set profile data with summary to indicate profile is loaded
            userProfile$.set({
                id: 'test_id',
                full_name: 'Test User',
                summary: 'Test summary',
                avatar_url: null,
                website: null,
                phone_number: null,
                birth_date: null,
                updated_at: new Date().toISOString(),
                family_story: null,
                primary_occupation: null
            });

            // Act again
            await viewModel.checkProfileActionsProgress();

            // Assert
            expect(viewModel.isProfileDataLoading$.get()).toBe(false);
        });

        it('should detect missing profile data when logged in', async () => {
            // Setup - set a user ID to mock being logged in, but no profile data
            user$.set({
                id: 'test_id',
                email: 'test@example.com',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            });
            
            userProfile$.set({
                id: 'test_id',
                full_name: 'Test User',
                summary: null,
                avatar_url: null,
                website: null,
                phone_number: null,
                birth_date: null,
                updated_at: new Date().toISOString(),
                family_story: null,
                primary_occupation: null
            });

            // Act
            await viewModel.checkProfileActionsProgress();

            // Assert
            expect(viewModel.isProfileDataLoading$.get()).toBe(true);

            // Now set profile data with summary
            userProfile$.set({
                id: 'test_id',
                full_name: 'Test User',
                summary: 'Test summary',
                avatar_url: null,
                website: null,
                phone_number: null,
                birth_date: null,
                updated_at: new Date().toISOString(),
                family_story: null,
                primary_occupation: null
            });

            // Act again
            await viewModel.checkProfileActionsProgress();

            // Assert
            expect(viewModel.isProfileDataLoading$.get()).toBe(false);
        });

        it('should wait for profile actions to complete', async () => {
            // Setup
            const progressId = `${ChangeType.USER_PROFILE_REFRESH}_${Date.now()}`;
            
            // Mock a running profile action
            generateDataService.generationProgress$.set({
                [progressId]: {
                    id: progressId,
                    status: 'running',
                    startTime: Date.now(),
                    totalActions: 1,
                    completedActions: 0,
                    actionProgress: {
                        'TestAction': {
                            actionName: 'TestAction',
                            status: 'started',
                            timestamp: Date.now()
                        }
                    }
                }
            });

            // Set a user ID to mock being logged in
            user$.set({
                id: 'test_id',
                email: 'test@example.com',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString()
            });

            // Start waiting in a non-blocking way
            const waitPromise = viewModel.waitForProfileActionsToComplete();
            
            // Simulate action completion after a short delay
            setTimeout(() => {
                generateDataService.generationProgress$.set({
                    [progressId]: {
                        id: progressId,
                        status: 'completed',
                        startTime: Date.now() - 1000,
                        endTime: Date.now(),
                        totalActions: 1,
                        completedActions: 1,
                        actionProgress: {
                            'TestAction': {
                                actionName: 'TestAction',
                                status: 'completed',
                                timestamp: Date.now()
                            }
                        }
                    }
                });
                
                // Set profile data with summary to indicate profile is loaded
                userProfile$.set({
                    id: 'test_id',
                    full_name: 'Test User',
                    summary: 'Test summary',
                    avatar_url: null,
                    website: null,
                    phone_number: null,
                    birth_date: null,
                    updated_at: new Date().toISOString(),
                    family_story: null,
                    primary_occupation: null
                });
            }, 50);
            
            // Act - await the result
            const result = await waitPromise;
            
            // Assert
            expect(result.isOk()).toBe(true);
            expect(viewModel.isProfileDataLoading$.get()).toBe(false);
        });
    });
}); 