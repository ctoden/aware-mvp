import { CliftonStrengthsViewModel } from '../CliftonStrengthsViewModel';
import { DependencyService } from '@src/core/injection/DependencyService';
import { UserAssessmentService } from '@src/services/UserAssessmentService';
import { TestAuthProvider } from '@src/providers/auth/__tests__/TestAuthProvider';
import { AUTH_PROVIDER_KEY } from '@src/providers/auth/AuthProvider';
import { TestDataProvider } from '@src/providers/data/__tests__/TestDataProvider';
import { DATA_PROVIDER_KEY } from '@src/providers/data/DataProvider';
import { TestLlmProvider } from '@src/providers/llm/__tests__/TestLlmProvider';
import { LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { TestStorageProvider } from '@src/providers/storage/__tests__/TestStorageProvider';
import { STORAGE_PROVIDER_KEY } from '@src/providers/storage/StorageProvider';
import { TestRemoteFunctionProvider } from '@src/providers/functions/__tests__/TestRemoteFunctionProvider';
import { REMOTE_FUNCTION_PROVIDER_KEY } from '@src/providers/functions/RemoteFunctionProvider';
import { AuthService } from '@src/services/AuthService';
import { DataService } from '@src/services/DataService';
import { LlmService } from '@src/services/LlmService';
import { LocalStorageService } from '@src/services/LocalStorageService';
import { RemoteFunctionService } from '@src/services/RemoteFunctionService';
import { user$ } from '@src/models/SessionModel';
import { AssessmentHandlerRegistry } from '@src/providers/assessment/AssessmentHandlerRegistry';
import { CliftonStrengthsAssessmentHandler } from '@src/providers/assessment/handlers/CliftonStrengthsAssessmentHandler';
import { userAssessments$ } from "@src/models/UserAssessment";

describe('CliftonStrengthsViewModel', () => {
    let cliftonStrengthsViewModel: CliftonStrengthsViewModel;
    let userAssessmentService: UserAssessmentService;
    let testAuthProvider: TestAuthProvider;
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;
    let testStorageProvider: TestStorageProvider;
    let testRemoteFunctionProvider: TestRemoteFunctionProvider;
    let authService: AuthService;
    let dataService: DataService;
    let llmService: LlmService;
    let localStorageService: LocalStorageService;
    let remoteFunctionService: RemoteFunctionService;
    let registry: AssessmentHandlerRegistry;
    let cliftonStrengthsHandler: CliftonStrengthsAssessmentHandler;

    const mockUser = {
        id: 'test-user-id',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'test@example.com'
    };

    beforeEach(async () => {
        // Set up providers
        testAuthProvider = new TestAuthProvider();
        testDataProvider = new TestDataProvider();
        testLlmProvider = new TestLlmProvider();
        testStorageProvider = new TestStorageProvider();
        testRemoteFunctionProvider = new TestRemoteFunctionProvider();

        await testAuthProvider.initialize();
        await testDataProvider.initialize();
        await testLlmProvider.initialize();
        await testStorageProvider.initialize();
        await testRemoteFunctionProvider.initialize();

        // Register providers
        DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
        DependencyService.registerValue(STORAGE_PROVIDER_KEY, testStorageProvider);
        DependencyService.registerValue(REMOTE_FUNCTION_PROVIDER_KEY, testRemoteFunctionProvider);

        // Initialize services
        authService = new AuthService();
        dataService = new DataService();
        llmService = new LlmService();
        localStorageService = new LocalStorageService();
        remoteFunctionService = new RemoteFunctionService();
        userAssessmentService = new UserAssessmentService();

        await authService.initialize();
        await dataService.initialize();
        await llmService.initialize();
        await localStorageService.initialize();
        await remoteFunctionService.initialize();
        await userAssessmentService.initialize();

        // Set up CliftonStrengths handler and registry
        registry = DependencyService.resolve(AssessmentHandlerRegistry);
        await registry.initialize();
        cliftonStrengthsHandler = new CliftonStrengthsAssessmentHandler(mockUser.id);
        registry.registerHandler(cliftonStrengthsHandler);

        // Create and initialize view model
        cliftonStrengthsViewModel = new CliftonStrengthsViewModel();
        await cliftonStrengthsViewModel.initialize();

        // Set up mock user
        user$.set(mockUser);
    });

    afterEach(async () => {
        await cliftonStrengthsViewModel.end();
        await userAssessmentService.end();
        await remoteFunctionService.end();
        await localStorageService.end();
        await llmService.end();
        await dataService.end();
        await authService.end();
        await registry.end();

        await testRemoteFunctionProvider.end();
        await testStorageProvider.end();
        await testLlmProvider.end();
        await testDataProvider.end();
        await testAuthProvider.end();

        user$.set(null);
        userAssessments$.set([]);
    });

    describe('full workflow', () => {
        it('should process an assessment', async () => {
            // Arrange
            const strengths = [
                { index: 0, value: 'Strategic' },
                { index: 1, value: 'Ideation' },
                { index: 2, value: 'Learner' },
                { index: 3, value: 'Achiever' },
                { index: 4, value: 'Intellection' }
            ];
            cliftonStrengthsViewModel.strengths$.set(strengths);

            // Act
            const results = await cliftonStrengthsViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(cliftonStrengthsViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(cliftonStrengthsViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
        });

        it('should process an assessment with text', async () => {
            // Arrange
            const strengths = [
                { index: 0, value: 'Strategic' },
                { index: 1, value: 'Ideation' },
                { index: 2, value: 'Learner' },
                { index: 3, value: 'Achiever' },
                { index: 4, value: 'Intellection' }
            ];
            cliftonStrengthsViewModel.strengths$.set(strengths);
            cliftonStrengthsViewModel.strengthsFullTextResult$.set("Detailed CliftonStrengths assessment text");

            // Act
            const results = await cliftonStrengthsViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(cliftonStrengthsViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(cliftonStrengthsViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
            expect(userAssessments$[0].assessment_full_text.get()).toBeTruthy();
        });
    });

    describe('isSubmitEnabled', () => {
        it('should return true when all strengths are filled', () => {
            // Arrange
            const strengths = [
                { index: 0, value: 'Strategic' },
                { index: 1, value: 'Ideation' },
                { index: 2, value: 'Learner' },
                { index: 3, value: 'Achiever' },
                { index: 4, value: 'Intellection' }
            ];
            cliftonStrengthsViewModel.strengths$.set(strengths);

            // Act
            const result = cliftonStrengthsViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when not all strengths are filled', () => {
            // Arrange
            const strengths = [
                { index: 0, value: 'Strategic' },
                { index: 1, value: '' },
                { index: 2, value: 'Learner' },
                { index: 3, value: 'Achiever' },
                { index: 4, value: 'Intellection' }
            ];
            cliftonStrengthsViewModel.strengths$.set(strengths);

            // Act
            const result = cliftonStrengthsViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('updateStrength', () => {
        it('should update strength value', () => {
            // Act
            cliftonStrengthsViewModel.updateStrength(0, 'Strategic');

            // Assert
            expect(cliftonStrengthsViewModel.strengths$[0].value.get()).toBe('Strategic');
        });

        it('should handle empty strength value', () => {
            // Act
            cliftonStrengthsViewModel.updateStrength(0, '');

            // Assert
            expect(cliftonStrengthsViewModel.strengths$[0].value.get()).toBe('');
        });

        it('should maintain index when updating strength', () => {
            // Act
            cliftonStrengthsViewModel.updateStrength(2, 'Learner');

            // Assert
            const strength = cliftonStrengthsViewModel.strengths$[2].get();
            expect(strength.index).toBe(2);
            expect(strength.value).toBe('Learner');
        });
    });
}); 