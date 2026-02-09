import { DependencyService } from "@src/core/injection/DependencyService";
import { ftuxState$ } from "@src/models/FtuxModel";
import { ChangeEvent, ChangeType, emitChange, change$ } from "@src/events/ChangeEvent";
import { user$ } from '@src/models/SessionModel';
import { UserAssessment, userAssessments$ } from "@src/models/UserAssessment";
import { UserModel } from '@src/models/UserModel';
import { UserProfile, userProfile$ } from '@src/models/UserProfile';
import { TestAuthProvider } from '@src/providers/auth/__tests__/TestAuthProvider';
import { AUTH_PROVIDER_KEY } from '@src/providers/auth/AuthProvider';
import { TestDataProvider } from '@src/providers/data/__tests__/TestDataProvider';
import { DATA_PROVIDER_KEY } from '@src/providers/data/DataProvider';
import { TestLlmProvider } from "@src/providers/llm/__tests__/TestLlmProvider";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { TestStorageProvider } from "@src/providers/storage/__tests__/TestStorageProvider";
import { STORAGE_PROVIDER_KEY } from "@src/providers/storage/StorageProvider";
import { AuthService } from '../AuthService';
import { DataService } from '../DataService';
import { LocalStorageService } from "../LocalStorageService";
import { UserProfileService } from '../UserProfileService';
import { GenerateDataService } from "../GenerateDataService";

describe('UserProfileService', () => {
    let userProfileService: UserProfileService;
    let testDataProvider: TestDataProvider;
    let testAuthProvider: TestAuthProvider;
    let testLLmProvider: TestLlmProvider;
    let testStorageProvider: TestStorageProvider;
    let localStorageService: LocalStorageService;
    
    // Track emitted events
    let capturedEvents: ChangeEvent[] = [];
    let unsubscribeFromEvents: () => void;

    let dataService: DataService;
    let authService: AuthService;

    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com'
    };

    const mockProfile = {
        id: 'test-user-id',
        full_name: 'Test User',
        avatar_url: null,
        website: null,
        summary: null,
        phone_number: null,
        birth_date: new Date('1990-01-01'),
        updated_at: null
    };

    const mockAssessments: UserAssessment[] = [
        {
            id: 'assessment-1',
            user_id: 'test-user-id',
            assessment_type: 'Test Assessment',
            assessment_summary: 'Test Summary',
            assessment_full_text: null,
            name: 'Test Assessment',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    beforeEach(async () => {
        // Set up event capturing
        capturedEvents = [];
        unsubscribeFromEvents = change$.onChange((change) => {
            if (change.value) {
                capturedEvents.push(change.value);
            }
        });

        // Create and initialize providers
        testDataProvider = new TestDataProvider();
        testAuthProvider = new TestAuthProvider();
        testLLmProvider = new TestLlmProvider();
        testStorageProvider = new TestStorageProvider();
        
        // Register providers
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLLmProvider);
        DependencyService.registerValue(STORAGE_PROVIDER_KEY, testStorageProvider);
        
        // Initialize providers
        await testDataProvider.initialize();
        await testAuthProvider.initialize();
        await testLLmProvider.initialize();
        await testStorageProvider.initialize();

        // Initialize the LocalStorageService
        localStorageService = LocalStorageService.getInstance();
        await localStorageService.initialize();

        // Create and initialize user profile service
        userProfileService = new UserProfileService();
        await userProfileService.initialize();

        // Set up default test data
        testDataProvider.setTestData('user_profiles', [mockProfile]);
        
        // Reset observable state
        userProfile$.set(mockProfile as UserProfile);
        user$.set(mockUser as UserModel);
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        userAssessments$.set(mockAssessments);
    });

    afterEach(async () => {
        // Cleanup event subscription
        if (unsubscribeFromEvents) {
            unsubscribeFromEvents();
        }

        await userProfileService.end();
        await localStorageService.end();
        await testDataProvider.end();
        await testAuthProvider.end();
        await testLLmProvider.end();
        await testStorageProvider.end();

        userProfile$.set(null);
        user$.set(null);
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        userAssessments$.set([]);
    });

    describe('fetchProfile', () => {
        it('should fetch user profile successfully', async () => {
            // Arrange
            testDataProvider.setTestData('user_profiles', [mockProfile]);

            // Act
            const result = await userProfileService.fetchProfile(mockUser.id);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(mockProfile);
            }
        });

        it('should return null when profile not found', async () => {
            // Act
            const result = await userProfileService.fetchProfile('non-existent-id');

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeNull();
            }
        });
    });

    describe('profile synchronization', () => {
        it('should update profile when userProfile$ changes', async () => {
            // Arrange
            const updatedProfile = { ...mockProfile, full_name: 'Updated Name' };

            // Act
            userProfile$.set(updatedProfile as UserProfile);
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Assert - check if data was updated in the provider
            const result = await userProfileService.fetchProfile(mockUser.id);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(updatedProfile);
            }
        });

        it('should fetch profile when user$ changes', async () => {
            // Arrange
            testDataProvider.setTestData('user_profiles', [mockProfile]);

            // Act
            user$.set(mockUser as UserModel);
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Assert
            expect(userProfile$.get()).toEqual(mockProfile);
        });

        it('should clear profile when user signs out', async () => {
            await userProfileService.initialize();
            // Arrange
            user$.set(mockUser as UserModel);
            userProfile$.set(mockProfile as UserProfile);

            // Act
            user$.set(null);
            
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));

            // Assert
            expect(userProfile$.get()).toBeNull();
            await userProfileService.end();
        });
    });

    describe('checkAndRefreshProfile', () => {
        beforeEach(async () => {
            // Set up storage for testing refresh functionality
            await localStorageService.setItem('refreshProfile', '');
            // Clear captured events from previous tests
            capturedEvents = [];
        });

        it('should skip refresh if FTUX is not completed', async () => {
            // Arrange
            ftuxState$.hasCompletedFTUX.set(false);

            // Act
            const result = await userProfileService.checkAndRefreshProfile();

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(false); // No refresh occurred
            }
            // Check that no events were emitted
            expect(capturedEvents.length).toBe(0);
        });

        it('should refresh if FTUX is completed and never refreshed before', async () => {
            // Arrange
            ftuxState$.hasCompletedFTUX.set(true);
            // Clear previous refresh time
            await localStorageService.setItem('refreshProfile', '');
            
            // Act
            const result = await userProfileService.checkAndRefreshProfile();

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(true); // Refresh occurred
            }
            
            // Check for USER_PROFILE event
            const profileEvent = capturedEvents.find(e => e.type === ChangeType.USER_PROFILE);
            expect(profileEvent).toBeDefined();
            expect(profileEvent?.payload).toBeDefined();
        });

        it('should refresh if more than 24 hours since last refresh', async () => {
            // Arrange
            ftuxState$.hasCompletedFTUX.set(true);
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 2); // 2 days ago
            await localStorageService.setItem('refreshProfile', oldDate.toISOString());

            // Act
            const result = await userProfileService.checkAndRefreshProfile();

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(true); // Refresh occurred
            }
            
            // Check for USER_PROFILE event
            const profileEvent = capturedEvents.find(e => e.type === ChangeType.USER_PROFILE);
            expect(profileEvent).toBeDefined();
            
            // Check for USER_ASSESSMENT event with correct payload
            const assessmentEvent = capturedEvents.find(e => e.type === ChangeType.USER_ASSESSMENT);
            expect(assessmentEvent).toBeDefined();
            expect(assessmentEvent?.payload).toHaveProperty('assessments');
            expect(assessmentEvent?.payload).toHaveProperty('useAllAssessments', true);
        });

        it('should not refresh if less than 24 hours since last refresh', async () => {
            // Arrange
            ftuxState$.hasCompletedFTUX.set(true);
            const recentDate = new Date();
            recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago
            await localStorageService.setItem('refreshProfile', recentDate.toISOString());

            // Act
            const result = await userProfileService.checkAndRefreshProfile();

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(false); // No refresh occurred
            }
            // Check that no events were emitted
            expect(capturedEvents.length).toBe(0);
        });
    });

    it('should register UserProfileRefreshAction with USER_PROFILE_REFRESH ModelChangeType', async () => {
        // Get the GenerateDataService
        const generateDataService = DependencyService.resolve(GenerateDataService);
        
        // Get actions registered for USER_PROFILE_REFRESH
        const actions = generateDataService.getActions(ChangeType.USER_PROFILE_REFRESH);
        
        // Verify that there's at least one action registered
        expect(actions.length).toBeGreaterThan(0);
        
        // Find the UserProfileRefreshAction
        const refreshAction = actions.find(action => action.name === 'UserProfileRefreshAction');
        
        // Verify that the action exists
        expect(refreshAction).toBeDefined();
    });

    it('should register UserProfileGenerateSummaryAction with USER_PROFILE_GENERATE_SUMMARY ModelChangeType', async () => {
        // Get the GenerateDataService
        const generateDataService = DependencyService.resolve(GenerateDataService);
        
        // Get actions registered for USER_PROFILE_GENERATE_SUMMARY
        const actions = generateDataService.getActions(ChangeType.USER_PROFILE_GENERATE_SUMMARY);
        
        // Verify that there's at least one action registered
        expect(actions.length).toBeGreaterThan(0);
        
        // Find the UserProfileGenerateSummaryAction
        const summaryAction = actions.find(action => action.name === 'UserProfileGenerateSummaryAction');
        
        // Verify that the action exists
        expect(summaryAction).toBeDefined();
    });
}); 