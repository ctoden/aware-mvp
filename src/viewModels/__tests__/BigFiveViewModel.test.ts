import { BigFiveViewModel } from '../BigFiveViewModel';
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
import { BigFiveAssessmentHandler } from '@src/providers/assessment/handlers/BigFiveAssessmentHandler';
import { userAssessments$ } from "@src/models/UserAssessment";

describe('BigFiveViewModel', () => {
    let bigFiveViewModel: BigFiveViewModel;
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
    let bigFiveHandler: BigFiveAssessmentHandler;

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

        // Set up BigFive handler and registry
        registry = DependencyService.resolve(AssessmentHandlerRegistry);
        await registry.initialize();
        bigFiveHandler = new BigFiveAssessmentHandler(mockUser.id);
        registry.registerHandler(bigFiveHandler);
        // DependencyService.registerValue(AssessmentHandlerRegistry, registry);

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

        // Create and initialize view model
        bigFiveViewModel = new BigFiveViewModel();
        await bigFiveViewModel.initialize();

        // Set up mock user
        user$.set(mockUser);
    });

    afterEach(async () => {
        await bigFiveViewModel.end();
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
            const scores = [
                { name: 'Openness', score: '80' },
                { name: 'Conscientiousness', score: '75' },
                { name: 'Extraversion', score: '60' },
                { name: 'Agreeableness', score: '85' },
                { name: 'Neuroticism', score: '40' }
            ];
            bigFiveViewModel.scores$.set(scores);

            // Act
            const results = await bigFiveViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(bigFiveViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(bigFiveViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
        });

        it('should process an assessment with text', async () => {
            // Arrange
            const scores = [
                { name: 'Openness', score: '80' },
                { name: 'Conscientiousness', score: '75' },
                { name: 'Extraversion', score: '60' },
                { name: 'Agreeableness', score: '85' },
                { name: 'Neuroticism', score: '40' }
            ];
            bigFiveViewModel.scores$.set(scores);
            bigFiveViewModel.bigFiveFullTextResult$.set("Detailed Big Five assessment text");

            registry.registerHandler(bigFiveHandler);

            // Act
            const results = await bigFiveViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(bigFiveViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(bigFiveViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
            expect(userAssessments$[0].assessment_full_text.get()).toBeTruthy();
        });
    });

    describe('isSubmitEnabled', () => {
        it('should return true when all scores are filled', () => {
            // Arrange
            const scores = [
                { name: 'Openness', score: '80' },
                { name: 'Conscientiousness', score: '75' },
                { name: 'Extraversion', score: '60' },
                { name: 'Agreeableness', score: '85' },
                { name: 'Neuroticism', score: '40' }
            ];
            bigFiveViewModel.scores$.set(scores);

            // Act
            const result = bigFiveViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when not all scores are filled', () => {
            // Arrange
            const scores = [
                { name: 'Openness', score: '80' },
                { name: 'Conscientiousness', score: '' },
                { name: 'Extraversion', score: '60' },
                { name: 'Agreeableness', score: '85' },
                { name: 'Neuroticism', score: '40' }
            ];
            bigFiveViewModel.scores$.set(scores);

            // Act
            const result = bigFiveViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when scores are invalid', () => {
            // Arrange
            const scores = [
                { name: 'Openness', score: '80' },
                { name: 'Conscientiousness', score: '75' },
                { name: 'Extraversion', score: '200' }, // Invalid score
                { name: 'Agreeableness', score: '85' },
                { name: 'Neuroticism', score: '40' }
            ];
            bigFiveViewModel.scores$.set(scores);

            // Act
            const result = bigFiveViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('updateScore', () => {
        it('should update score within valid range', () => {
            // Act
            bigFiveViewModel.updateScore(0, '80');

            // Assert
            expect(bigFiveViewModel.scores$[0].score.get()).toBe('80');
        });

        it('should handle empty score', () => {
            // Act
            bigFiveViewModel.updateScore(0, '');

            // Assert
            expect(bigFiveViewModel.scores$[0].score.get()).toBe('');
        });

        it('should clamp score to valid range', () => {
            // Act
            bigFiveViewModel.updateScore(0, '150');

            // Assert
            expect(bigFiveViewModel.scores$[0].score.get()).toBe('120');
        });
    });
}); 