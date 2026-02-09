import {ftuxState$} from "@src/models/FtuxModel";
import {DependencyService} from "@src/core/injection/DependencyService";
import {GenerateDataService} from "@src/services/GenerateDataService";
import {ChangeType, emitChange} from "@src/events/ChangeEvent";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";
import {user$} from "@src/models/SessionModel";
import {userAssessments$} from "@src/models/UserAssessment";
import {DATA_PROVIDER_KEY} from "@src/providers/data/DataProvider";
import {DataService} from "@src/services/DataService";
import {LlmService} from "@src/services/LlmService";
import {CoreValuesService} from "@src/services/CoreValuesService";
import {test} from "../../../__tests__/setupIntegrationTest";
import {createMockUser} from "@src/utils/testing/ProfessionalDevelopmentTestHelper";
import {createMockCoreValues} from "@src/utils/testing/CoreValuesTestHelper";
import {clearCoreValues, getUserCoreValuesArray} from "@src/models/UserCoreValue";
import {waitForChangeActions} from "@src/utils/testing/FtuxTestHelper";

describe("FetchCoreValuesAction Integration Tests", () => {
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;

    const mockUser = createMockUser();
    const mockCoreValues = createMockCoreValues(mockUser.id, 3);

    beforeEach(async () => {
        // Clear any existing data
        user$.set(null);
        userAssessments$.set([]);
        clearCoreValues();

        // Reset FTUX state
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.currentStep.set(0);

        // Set up test providers
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        testDataProvider.setTestData('user_core_values', mockCoreValues);

        // Initialize TestLlmProvider
        testLlmProvider = new TestLlmProvider();
        testLlmProvider.clearMockResponses();

        // Register the test providers
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Initialize services in the correct order
        const dataService = DependencyService.resolve(DataService);
        await dataService.initialize();

        // Initialize LlmService
        const llmService = DependencyService.resolve(LlmService);
        await llmService.initialize();

        // Initialize GenerateDataService
        const generateDataService = DependencyService.resolve(GenerateDataService);
        await generateDataService.initialize();

        // Initialize CoreValuesService which registers actions with GenerateDataService
        const coreValuesService = DependencyService.resolve(CoreValuesService);
        await coreValuesService.initialize();

        // Initialize user
        user$.set(mockUser);
    });

    afterEach(async () => {
        user$.set(null);
        userAssessments$.set([]);
        clearCoreValues();

        // Reset FTUX state
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.currentStep.set(0);

        // End services in reverse order
        const coreValuesService = DependencyService.resolve(CoreValuesService);
        await coreValuesService.end();

        const generateDataService = DependencyService.resolve(GenerateDataService);
        await generateDataService.end();

        const llmService = DependencyService.resolve(LlmService);
        await llmService.end();

        const dataService = DependencyService.resolve(DataService);
        await dataService.end();

        await testDataProvider.end();
        testDataProvider.clearTestData();

        DependencyService.unregister(DATA_PROVIDER_KEY);
        DependencyService.unregister(LLM_PROVIDER_KEY);
    });

    test("Core values are fetched from the database when the user is authenticated", async () => {
        // Act - Verify GenerateDataService is properly initialized
        const generateDataService = DependencyService.resolve(GenerateDataService);
        expect(generateDataService).not.toBeNull();

        // Verify registered actions for LOGIN (not AUTH anymore)
        const registeredActions = generateDataService.getActions(ChangeType.LOGIN);
        expect(registeredActions.length).toBeGreaterThan(0);
        expect(registeredActions.some(action => action.name === 'FetchCoreValuesAction')).toBe(true);

        // Trigger login event
        emitChange(ChangeType.LOGIN, { user: mockUser }, 'system');

        // Wait for login actions to complete
        await waitForChangeActions(ChangeType.LOGIN);

        // Assert - Core values should be fetched
        const coreValues = getUserCoreValuesArray();
        expect(coreValues.length).toBe(mockCoreValues.length);
        
        // Verify the core values match
        for (const mockValue of mockCoreValues) {
            const foundValue = coreValues.find(cv => cv.title === mockValue.title);
            expect(foundValue).toBeDefined();
            expect(foundValue?.description).toBe(mockValue.description);
        }
    });
});