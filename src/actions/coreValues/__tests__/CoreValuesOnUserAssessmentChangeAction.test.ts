import { DependencyService } from "@src/core/injection/DependencyService";
import { ftuxState$ } from "@src/models/FtuxModel";
import { ChangeType, emitChange } from "@src/events/ChangeEvent";
import { user$ } from "@src/models/SessionModel";
import { userAssessments$ } from "@src/models/UserAssessment";
import { clearCoreValues, getUserCoreValuesArray } from "@src/models/UserCoreValue";
import { TestDataProvider } from "@src/providers/data/__tests__/TestDataProvider";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { TestLlmProvider } from "@src/providers/llm/__tests__/TestLlmProvider";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { CoreValuesService } from "@src/services/CoreValuesService";
import { DataService } from "@src/services/DataService";
import { GenerateDataService } from "@src/services/GenerateDataService";
import { LlmService } from "@src/services/LlmService";
import { createLoveLanguagesAssessment } from "@src/utils/testing/AssessmentTestHelper";
import { createCoreValuesLlmResponse } from "@src/utils/testing/CoreValuesTestHelper";
import { setupFtuxForCoreValues, waitForChangeActions } from "@src/utils/testing/FtuxTestHelper";
import { createMockAssessment, createMockUser } from "@src/utils/testing/ProfessionalDevelopmentTestHelper";
import { test } from "../../../__tests__/setupIntegrationTest";
import { CoreValuesOnUserAssessmentChangeAction } from "../CoreValuesOnUserAssessmentChangeAction";

describe("CoreValuesOnUserAssessmentChangeAction Tests", () => {
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;
    let coreValuesService: CoreValuesService;
    let llmService: LlmService;
    let action: CoreValuesOnUserAssessmentChangeAction;

    const mockUser = createMockUser();
    const mockAssessments = [
        createMockAssessment(mockUser.id, "DISC", { assessment_summary: "Dominant, Influential" }),
        createMockAssessment(mockUser.id, "Enneagram", { assessment_summary: "Type 3 - The Achiever" })
    ];
    
    // Mock core values that will be returned by the LLM
    const mockGeneratedCoreValues = [
        { title: "Integrity", description: "Being honest and having strong moral principles" },
        { title: "Compassion", description: "Showing concern for the suffering of others" },
        { title: "Growth", description: "Continuous personal and professional development" }
    ];

    beforeEach(async () => {
        // Clear any existing data
        user$.set(null);
        userAssessments$.set([]);
        clearCoreValues();

        // Set up test providers
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();

        // Initialize TestLlmProvider with mock responses
        testLlmProvider = new TestLlmProvider();
        testLlmProvider.clearMockResponses();
        
        // Set up the structured response for CreateCoreValuesAction
        testLlmProvider.setNextResponse(JSON.stringify({
            core_values: mockGeneratedCoreValues
        }));

        // Register the test providers
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Initialize services in the correct order
        const dataService = DependencyService.resolve(DataService);
        await dataService.initialize();

        // Initialize LlmService
        llmService = DependencyService.resolve(LlmService);
        await llmService.initialize();

        // Initialize GenerateDataService
        const generateDataService = DependencyService.resolve(GenerateDataService);
        await generateDataService.initialize();

        // Initialize CoreValuesService
        coreValuesService = DependencyService.resolve(CoreValuesService);
        await coreValuesService.initialize();

        // Initialize user
        user$.set(mockUser);
        
        // Create the action
        action = new CoreValuesOnUserAssessmentChangeAction(coreValuesService);
        
        // Register the action with the GenerateDataService
        generateDataService.registerActions(ChangeType.USER_ASSESSMENT, [action]);
        
        // Set up FTUX completion for certain tests
        ftuxState$.hasCompletedFTUX.set(true);
    });

    afterEach(async () => {
        // Clean up
        user$.set(null);
        userAssessments$.set([]);
        clearCoreValues();

        // End services in reverse order
        await coreValuesService.end();
        
        const generateDataService = DependencyService.resolve(GenerateDataService);
        await generateDataService.end();
        
        await llmService.end();
        
        const dataService = DependencyService.resolve(DataService);
        await dataService.end();

        await testDataProvider.end();
        testDataProvider.clearTestData();

        DependencyService.unregister(DATA_PROVIDER_KEY);
        DependencyService.unregister(LLM_PROVIDER_KEY);
    });

    it("Should generate core values based on assessments", async () => {
        // Arrange
        userAssessments$.set(mockAssessments);
        testLlmProvider.setNextResponse(JSON.stringify({
            core_values: mockGeneratedCoreValues
        }));

        // Act
        const result = await action.execute(mockAssessments, true);

        // Assert
        expect(result.isOk()).toBe(true);
        
        // Verify core values were created
        const coreValues = getUserCoreValuesArray();
        expect(coreValues.length).toBe(mockGeneratedCoreValues.length);
        
        // Verify the core values match what was generated
        for (const mockValue of mockGeneratedCoreValues) {
            const foundValue = coreValues.find(cv => cv.title === mockValue.title);
            expect(foundValue).toBeDefined();
            expect(foundValue?.description).toBe(mockValue.description);
        }
    });

    it("Should handle empty assessments array", async () => {
        // Act
        const result = await action.execute([], true);

        // Assert
        expect(result.isOk()).toBe(true);
        
        // No core values should be generated
        const coreValues = getUserCoreValuesArray();
        expect(coreValues.length).toBe(0);
    });

    it("Should handle LLM error", async () => {
        // Arrange
        testLlmProvider.clearMockResponses();
        testLlmProvider.setNextResponse("error");
        
        // Act
        const result = await action.execute(mockAssessments, true);

        // Assert
        expect(result.isErr()).toBe(true);
        // The error message will be different with the new implementation
        expect(result._unsafeUnwrapErr()).toBeDefined();
    });

    it("Should clear existing core values before creating new ones", async () => {
        // Arrange - Create some initial core values
        const initialValues = [
            { title: "Initial Value", description: "This should be cleared" }
        ];
        
        // Add initial values
        for (const value of initialValues) {
            await coreValuesService.createCoreValue(value);
        }
        
        // Verify initial values were created
        let coreValues = getUserCoreValuesArray();
        expect(coreValues.length).toBe(initialValues.length);
        
        // Set up the response for the new values
        testLlmProvider.setNextResponse(JSON.stringify({
            core_values: mockGeneratedCoreValues
        }));
        
        // Act - Generate new core values
        const result = await action.execute(mockAssessments, true);

        // Assert
        expect(result.isOk()).toBe(true);
        
        // Verify only the new values exist
        coreValues = getUserCoreValuesArray();
        expect(coreValues.length).toBe(mockGeneratedCoreValues.length);
        
        // The initial values should no longer exist
        expect(coreValues.some(cv => cv.title === initialValues[0].title)).toBe(false);
        
        // The new values should exist
        for (const mockValue of mockGeneratedCoreValues) {
            expect(coreValues.some(cv => cv.title === mockValue.title)).toBe(true);
        }
    });

    it("Should be triggered by USER_ASSESSMENT model change", async () => {
        // Arrange
        testLlmProvider.setNextResponse(JSON.stringify({
            core_values: mockGeneratedCoreValues
        }));
        
        // Act - Emit model change event for user assessments
        userAssessments$.set(mockAssessments);
        
        // Use the payload format expected by AssessmentBasedAction
        emitChange(ChangeType.USER_ASSESSMENT, {
            assessments: mockAssessments,
            useAllAssessments: true
        }, 'system');
        
        // Wait for model change actions to complete
        await waitForChangeActions(ChangeType.USER_ASSESSMENT);
        
        // Add a small delay to ensure processing completes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Assert - Core values should be generated
        const coreValues = getUserCoreValuesArray();
        expect(coreValues.length).toBe(mockGeneratedCoreValues.length);
    });

    test("Core values are updated when a user adds a second assessment after finishing FTUX", async () => {
        // Arrange
        // Create first set of core values
        const firstCoreValues = [
            { title: "Quality Time", description: "Spending dedicated attention with loved ones" },
            { title: "Communication", description: "Open and honest dialogue in relationships" },
            { title: "Emotional Intelligence", description: "Understanding and managing emotions effectively" }
        ];
        
        testLlmProvider.setNextResponse(JSON.stringify({
            core_values: firstCoreValues
        }));
        
        // Complete FTUX and generate initial core values
        ftuxState$.hasCompletedFTUX.set(true);
        await action.execute(mockAssessments, true);
        
        // Verify the initial core values
        const initialCoreValues = getUserCoreValuesArray();
        expect(initialCoreValues.length).toBe(3);
        expect(initialCoreValues.some(cv => cv.title === "Quality Time")).toBe(true);
        
        // Set up the second set of core values that will be generated
        const secondCoreValues = [
            { title: "Quality Time", description: "Spending dedicated attention with loved ones" },
            { title: "Communication", description: "Open and honest dialogue in relationships" },
            { title: "Leadership", description: "Guiding others toward shared goals" }
        ];
        
        testLlmProvider.setNextResponse(JSON.stringify({
            core_values: secondCoreValues
        }));
        
        // Act - Add a new assessment and trigger an update
        const newAssessment = createMockAssessment(mockUser.id, "Leadership", { assessment_summary: "Strong leadership skills" });
        const updatedAssessments = [...mockAssessments, newAssessment];
        userAssessments$.set(updatedAssessments);
        
        // Trigger update by emitting event with the expected payload format
        emitChange(ChangeType.USER_ASSESSMENT, {
            assessments: updatedAssessments,
            useAllAssessments: true
        }, 'system');
        
        // Wait for model change actions to complete
        await waitForChangeActions(ChangeType.USER_ASSESSMENT);
        
        // Add a small delay to ensure processing completes
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Assert - Verify core values were updated
        const updatedCoreValues = getUserCoreValuesArray();
        expect(updatedCoreValues.length).toBe(3);
        
        // Verify the new core values are present
        expect(updatedCoreValues.some(cv => cv.title === "Leadership")).toBe(true);
        expect(updatedCoreValues.some(cv => cv.title === "Emotional Intelligence")).toBe(false);

        // Verify original core values that remained
        expect(updatedCoreValues.some(cv => cv.title === "Quality Time")).toBe(true);
        expect(updatedCoreValues.some(cv => cv.title === "Communication")).toBe(true);
    });

    test("Should be triggered after FTUX completion", async () => {
        // Arrange
        // Reset FTUX state
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        
        // Set up the mock response for generateStructuredOutput
        testLlmProvider.setNextResponse(JSON.stringify({
            core_values: mockGeneratedCoreValues
        }));
        
        // Complete FTUX flow using our helper
        await setupFtuxForCoreValues(mockUser.id);
        
        // Verify FTUX completion
        expect(ftuxState$.hasCompletedFTUX.get()).toBe(true);
        
        // Assert - Core values should be generated
        const coreValues = getUserCoreValuesArray();
        expect(coreValues.length).toBe(mockGeneratedCoreValues.length);
    });
}); 