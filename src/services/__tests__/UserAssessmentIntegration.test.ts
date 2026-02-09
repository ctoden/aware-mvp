import { DependencyService } from "@src/core/injection/DependencyService";
import { session$, user$ } from '@src/models/SessionModel';
import { UserAssessment, userAssessments$ } from '@src/models/UserAssessment';
import { userProfile$ } from '@src/models/UserProfile';
import { AssessmentHandlerRegistry } from '@src/providers/assessment/AssessmentHandlerRegistry';
import { BigFiveAssessmentHandler } from '@src/providers/assessment/handlers/BigFiveAssessmentHandler';
import { CliftonStrengthsAssessmentHandler } from '@src/providers/assessment/handlers/CliftonStrengthsAssessmentHandler';
import { DiscAssessmentHandler } from '@src/providers/assessment/handlers/DiscAssessmentHandler';
import { EnneagramAssessmentHandler } from '@src/providers/assessment/handlers/EnneagramAssessmentHandler';
import { LoveLanguagesAssessmentHandler } from '@src/providers/assessment/handlers/LoveLanguagesAssessmentHandler';
import {MBTIAssessmentHandler, MBTIData} from '@src/providers/assessment/handlers/MBTIAssessmentHandler';
import { MotivationCodeAssessmentHandler } from '@src/providers/assessment/handlers/MotivationCodeAssessmentHandler';
import { TestAuthProvider } from '@src/providers/auth/__tests__/TestAuthProvider';
import { AUTH_PROVIDER_KEY } from '@src/providers/auth/AuthProvider';
import { TestDataProvider } from '@src/providers/data/__tests__/TestDataProvider';
import { DATA_PROVIDER_KEY } from '@src/providers/data/DataProvider';
import { TestRemoteFunctionProvider } from '@src/providers/functions/__tests__/TestRemoteFunctionProvider';
import { REMOTE_FUNCTION_PROVIDER_KEY } from '@src/providers/functions/RemoteFunctionProvider';
import { LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { OpenAiLlmProvider } from '@src/providers/llm/OpenAiLlmProvider';
import { TestStorageProvider } from '@src/providers/storage/__tests__/TestStorageProvider';
import { STORAGE_PROVIDER_KEY } from '@src/providers/storage/StorageProvider';
import { MBTIViewModel } from '@src/viewModels/MBTIViewModel';
import { AuthService } from '../AuthService';
import { CoreValuesService } from '../CoreValuesService';
import { DataService } from '../DataService';
import { LlmService } from '../LlmService';
import { LocalStorageService } from '../LocalStorageService';
import { RemoteFunctionService } from '../RemoteFunctionService';
import { UserAssessmentService } from '../UserAssessmentService';
import {clone, get} from "lodash";
import {MistralLlmProvider} from "@src/providers/llm/MistralLlmProvider";
import Mustache from "mustache";
import { UserProfileService } from '../UserProfileService';
import { FtuxService } from '../FtuxService';
import { FTUX_FLOW_COMPLETED_KEY, INTRO_COMPLETED_KEY, ftuxState$ } from '@src/models/FtuxModel';
import { familyStory$ } from '@src/models/FamilyStoryModel';
import { careerJourneyEntries$ } from '@src/models/CareerJourneyModel';
import { userMainInterests$ } from '@src/models/UserMainInterest';
import { userLongTermGoals$ } from '@src/models/UserLongTermGoal';
import { userShortTermGoals$ } from '@src/models/UserShortTermGoal';
import { userInnerCircle$ } from '@src/models/UserInnerCircle';
import { ChangeEvent, ChangeType, emitChange, change$ } from '@src/events/ChangeEvent';

const shouldRun = true;

const conditionalDescribeFunction = (shouldRun: boolean) => {
    return shouldRun ? describe : describe.skip;
};

const conditionalDescribe = conditionalDescribeFunction(shouldRun);

describe('UserAssessment Integration Tests', () => {
    let userAssessmentService: UserAssessmentService;
    let testDataProvider: TestDataProvider;
    let testAuthProvider: TestAuthProvider;
    let openAiLlmProvider: OpenAiLlmProvider;
    let testStorageProvider: TestStorageProvider;
    let testRemoteFunctionProvider: TestRemoteFunctionProvider;
    let dataService: DataService;
    let authService: AuthService;
    let llmService: LlmService;
    let localStorageService: LocalStorageService;
    let remoteFunctionService: RemoteFunctionService;
    let mbtiViewModel: MBTIViewModel;
    let assessmentHandlerRegistry: AssessmentHandlerRegistry;
    let coreValuesService: CoreValuesService;
    let userProfileService: UserProfileService;
    let ftuxService: FtuxService;

    // Track emitted events for some tests
    let capturedEvents: ChangeEvent[] = [];
    let unsubscribeFromEvents: () => void;

    let openAiApiKeyFromTestEnv: string;

    let mistralApiKeyFromTestEnv: string;
    let mistralLlmProvider: MistralLlmProvider;

    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    const mockProfile = {
        id: mockUser.id,
        full_name: 'Jim Carter',
        avatar_url: null,
        website: null,
        summary: null,
        phone_number: '123-456-7890',
        updated_at: new Date().toISOString(),
        family_story: null,
        primary_occupation: null,
        birth_date: null
    };

    beforeAll(()=>{
        // KEEP THIS - jest messes up the process.env and the process.env.EXPO_PUBLIC_OPENAI_API_KEY is undefined
        openAiApiKeyFromTestEnv = get(global, 'test.env.EXPO_PUBLIC_OPENAI_API_KEY') as unknown as string;
        mistralApiKeyFromTestEnv = get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY') as unknown as string;
    })

    beforeEach(async () => {
        // Reset observables
        userAssessments$.set([]);
        userProfile$.set(mockProfile);
        user$.set(null);
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.currentStep.set(0);
        familyStory$.set({ story: '' });
        careerJourneyEntries$.set([]);
        userMainInterests$.set({});
        userLongTermGoals$.set({});
        userShortTermGoals$.set({});
        userInnerCircle$.set([]);

        // Set up event capturing
        capturedEvents = [];
        unsubscribeFromEvents = change$.onChange((change) => {
            if (change.value) {
                capturedEvents.push(change.value);
            }
        });

        console.log("Test setup - registering API keys");
        DependencyService.registerValue("OPENAI_API_KEY", openAiApiKeyFromTestEnv);
        DependencyService.registerValue("OPENAI_DEFAULT_MODEL", "gpt-4o");

        DependencyService.registerValue("MISTRAL_API_KEY", mistralApiKeyFromTestEnv);
        DependencyService.registerValue("MISTRAL_DEFAULT_MODEL", "ministral-3b-latest");

        // Create providers
        console.log("Test setup - creating providers");
        testDataProvider = new TestDataProvider();
        testAuthProvider = new TestAuthProvider();
        openAiLlmProvider = new OpenAiLlmProvider();
        mistralLlmProvider = new MistralLlmProvider();
        testStorageProvider = new TestStorageProvider();
        testRemoteFunctionProvider = new TestRemoteFunctionProvider();
        
        // Register providers
        console.log("Test setup - registering providers");
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, openAiLlmProvider);
        DependencyService.registerValue(STORAGE_PROVIDER_KEY, testStorageProvider);
        DependencyService.registerValue(REMOTE_FUNCTION_PROVIDER_KEY, testRemoteFunctionProvider);
        
        // Initialize providers
        console.log("Test setup - initializing providers");
        await testDataProvider.initialize();
        await testAuthProvider.initialize();
        await openAiLlmProvider.initialize();
        await testStorageProvider.initialize();
        await testRemoteFunctionProvider.initialize();
        await mistralLlmProvider.initialize();

        // Initialize services
        console.log("Test setup - initializing services");
        dataService = DependencyService.resolve(DataService);
        authService = DependencyService.resolve(AuthService);
        llmService = DependencyService.resolve(LlmService);
        localStorageService = DependencyService.resolve(LocalStorageService);
        remoteFunctionService = DependencyService.resolve(RemoteFunctionService);
        assessmentHandlerRegistry = DependencyService.resolve(AssessmentHandlerRegistry);
        coreValuesService = DependencyService.resolve(CoreValuesService);
        userProfileService = DependencyService.resolve(UserProfileService);
        ftuxService = DependencyService.resolve(FtuxService);

        await dataService.initialize();
        await authService.initialize();
        await llmService.initialize();
        await localStorageService.initialize();
        await remoteFunctionService.initialize();
        await assessmentHandlerRegistry.initialize();
        await coreValuesService.initialize();
        await userProfileService.initialize();
        await ftuxService.initialize();

        // Verify LLM service is ready
        console.log("Test setup - verifying LLM service");
        try {
            const testPrompt = "This is a test prompt. Respond with 'OK' if you receive this.";
            const llmTestResult = await llmService.generateSummary(testPrompt);
            console.log("LLM test generation result:", llmTestResult);
            expect(llmTestResult.isOk()).toBe(true);
        } catch (error) {
            console.error("LLM service test failed:", error);
            // Don't fail the test here, just log the error
        }

        // Register assessment handlers
        const testUserId = mockUser.id;
        assessmentHandlerRegistry.registerHandler(new MBTIAssessmentHandler(testUserId));
        assessmentHandlerRegistry.registerHandler(new BigFiveAssessmentHandler(testUserId));
        assessmentHandlerRegistry.registerHandler(new DiscAssessmentHandler(testUserId));
        assessmentHandlerRegistry.registerHandler(new CliftonStrengthsAssessmentHandler(testUserId));
        assessmentHandlerRegistry.registerHandler(new EnneagramAssessmentHandler(testUserId));
        assessmentHandlerRegistry.registerHandler(new LoveLanguagesAssessmentHandler(testUserId));
        assessmentHandlerRegistry.registerHandler(new MotivationCodeAssessmentHandler(testUserId));

        // Create and initialize assessment service
        userAssessmentService = new UserAssessmentService();
        await userAssessmentService.initialize();

        // Create and initialize MBTI view model
        mbtiViewModel = new MBTIViewModel();
        await mbtiViewModel.initialize();

        // Set up test data
        testDataProvider.setTestData('user_profiles', [mockProfile]);
    });

    afterEach(async () => {
        // Cleanup event subscription
        if (unsubscribeFromEvents) {
            unsubscribeFromEvents();
        }

        await mbtiViewModel.end();
        await userAssessmentService.end();
        await coreValuesService.end();
        await assessmentHandlerRegistry.end();
        await userProfileService.end();
        await ftuxService.end();
        await dataService.end();
        await authService.end();
        await llmService.end();
        await localStorageService.end();
        await remoteFunctionService.end();

        await testDataProvider.end();
        await testAuthProvider.end();
        await openAiLlmProvider.end();
        await testStorageProvider.end();
        await testRemoteFunctionProvider.end();

        userAssessments$.set([]);
        userProfile$.set(null);
        user$.set(null);
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.currentStep.set(0);
        familyStory$.set({ story: '' });
        careerJourneyEntries$.set([]);
        userMainInterests$.set({});
        userLongTermGoals$.set({});
        userShortTermGoals$.set({});
        userInnerCircle$.set([]);
    });

    describe('FTUX flow', () => {
        it('should complete FTUX flow successfully', async () => {
            // Arrange
            user$.set(mockUser);
            userProfile$.set(mockProfile);
            ftuxState$.hasCompletedIntro.set(true);

            // Act
            await ftuxService.setFtuxCompleted(true);

            // Assert
            const ftuxEvents = capturedEvents.filter(e => e.type === ChangeType.FTUX);
            expect(ftuxEvents).toHaveLength(1);
            expect(ftuxEvents[0].payload.hasCompletedFTUX).toBe(true);

            const profileEvent = capturedEvents.find(e => e.type === ChangeType.USER_PROFILE);
            expect(profileEvent).toBeDefined();
            expect(profileEvent?.payload).toBeDefined();

            const assessmentEvent = capturedEvents.find(e => e.type === ChangeType.USER_ASSESSMENT);
            expect(assessmentEvent).toBeDefined();
            expect(assessmentEvent?.payload).toBeDefined();
        });
    });

    describe('Assessment flow', () => {
        it('should complete assessment flow successfully', async () => {
            // Arrange
            user$.set(mockUser);
            userProfile$.set(mockProfile);
            ftuxState$.hasCompletedFTUX.set(true);

            // Act
            const result = await userAssessmentService.processAssessment('MBTI', {
                name: 'MBTI Assessment',
                assessmentResult: 'Test assessment result',
                dichotomies: ['E', 'N', 'T', 'J']
            });

            // Assert
            expect(result.isOk()).toBe(true);

            const ftuxEvents = capturedEvents.filter(e => e.type === ChangeType.FTUX && e.payload?.hasCompletedFTUX === true);
            expect(ftuxEvents).toHaveLength(1);

            const profileEvents = capturedEvents.filter(e => e.type === ChangeType.USER_PROFILE);
            expect(profileEvents).toHaveLength(1);

            const assessmentEvents = capturedEvents.filter(
                e => e.type === ChangeType.USER_ASSESSMENT &&
                e.payload?.assessments?.length > 0
            );
            expect(assessmentEvents).toHaveLength(1);
        });
    });
}); 