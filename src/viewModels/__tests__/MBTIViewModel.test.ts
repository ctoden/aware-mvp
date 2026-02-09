import {MBTIViewModel} from '../MBTIViewModel';
import {DependencyService} from '@src/core/injection/DependencyService';
import {UserAssessmentService} from '@src/services/UserAssessmentService';
import {TestAuthProvider} from '@src/providers/auth/__tests__/TestAuthProvider';
import {AUTH_PROVIDER_KEY} from '@src/providers/auth/AuthProvider';
import {TestDataProvider} from '@src/providers/data/__tests__/TestDataProvider';
import {DATA_PROVIDER_KEY} from '@src/providers/data/DataProvider';
import {TestLlmProvider} from '@src/providers/llm/__tests__/TestLlmProvider';
import {LLM_PROVIDER_KEY} from '@src/providers/llm/LlmProvider';
import {TestStorageProvider} from '@src/providers/storage/__tests__/TestStorageProvider';
import {STORAGE_PROVIDER_KEY} from '@src/providers/storage/StorageProvider';
import {TestRemoteFunctionProvider} from '@src/providers/functions/__tests__/TestRemoteFunctionProvider';
import {REMOTE_FUNCTION_PROVIDER_KEY} from '@src/providers/functions/RemoteFunctionProvider';
import {AuthService} from '@src/services/AuthService';
import {DataService} from '@src/services/DataService';
import {LlmService} from '@src/services/LlmService';
import {LocalStorageService} from '@src/services/LocalStorageService';
import {RemoteFunctionService} from '@src/services/RemoteFunctionService';
import {user$} from '@src/models/SessionModel';
import {AssessmentHandlerRegistry} from '@src/providers/assessment/AssessmentHandlerRegistry';
import {MBTIAssessmentHandler} from '@src/providers/assessment/handlers/MBTIAssessmentHandler';
import {userAssessments$} from "@src/models/UserAssessment";

describe('MBTIViewModel', () => {
    let mbtiViewModel: MBTIViewModel;
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
    let mbtiHandler: MBTIAssessmentHandler;

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

        // Set up MBTI handler and registry
        registry = new AssessmentHandlerRegistry();
        await registry.initialize();
        mbtiHandler = new MBTIAssessmentHandler(mockUser.id);
        registry.registerHandler(mbtiHandler);
        DependencyService.registerValue(AssessmentHandlerRegistry, registry);

        // Create and initialize view model
        mbtiViewModel = new MBTIViewModel();
        await mbtiViewModel.initialize();

        const validResponse = JSON.stringify([
            { title: "Value One", description: "First core value description." },
            { title: "Value Two", description: "Second core value description." },
            { title: "Value Three", description: "Third core value description." }
        ]);
        testLlmProvider.setNextResponse(validResponse);

        // Set up mock user
        user$.set(mockUser);
    });

    afterEach(async () => {
        await mbtiViewModel.end();
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
    });

    describe("full workflow", ()=> {
        it('should process an assessment', async () => {
            const vm = new MBTIViewModel();
            await vm.initialize();
            // Arrange
            mbtiViewModel.selectedDichotomies$.set({
                energy: "E",
                information: "N",
                decision: "T",
                lifestyle: "J"
            });

            const results = await mbtiViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(mbtiViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(mbtiViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
        }, 5000);


        it('should process an assessment with text', async () => {
            userAssessments$.set([]);
            const vm = new MBTIViewModel();
            await vm.initialize();
            // Arrange
            mbtiViewModel.selectedDichotomies$.set({
                energy: "E",
                information: "N",
                decision: "T",
                lifestyle: "J"
            });

            mbtiViewModel.mbtiFullTextResult$.set("ENJF text result");

            const results = await mbtiViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(mbtiViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(mbtiViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
            expect(userAssessments$[0].assessment_full_text.get()).toBe("ENJF text result");
        })
    })

    describe('isSubmitEnabled', () => {
        it('should return true when all dichotomy pairs have a selection', async () => {
            const vm = new MBTIViewModel();
            await vm.initialize();
            // Act
            const isSubmitEnabled = vm.isSubmitEnabled();

            // Assert
            expect(isSubmitEnabled).toBe(false);

            // Arrange
            mbtiViewModel.selectedDichotomies$.set({
                energy: "E",
                information: "N",
                decision: "T",
                lifestyle: "J"
            });

            // Act
            const result = mbtiViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when not all dichotomy pairs have a selection', async () => {
            const vm = new MBTIViewModel();
            await vm.initialize();
            // Act
            const isSubmitEnabled = vm.isSubmitEnabled();

            // Assert
            expect(isSubmitEnabled).toBe(false);

            vm.setEnergy("E");

            // Act
            expect(vm.isSubmitEnabled()).toBe(false);

            vm.setInformation("S");
            vm.setLifestyle("P");
            vm.setDecision("F");

            expect(vm.isSubmitEnabled()).toBe(true);
        })
    });
}); 