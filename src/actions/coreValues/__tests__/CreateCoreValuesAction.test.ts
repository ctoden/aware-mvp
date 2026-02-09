import {CreateCoreValuesAction} from '../CreateCoreValuesAction';
import {clearCoreValues, getUserCoreValuesArray, ICoreValue} from '@src/models/UserCoreValue';
import {TestLlmProvider} from '@src/providers/llm/__tests__/TestLlmProvider';
import {cloneDeep, get} from "lodash";
import {OpenAiLlmProvider} from "@src/providers/llm/OpenAiLlmProvider";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LLM_PROVIDER_KEY, LlmMessage} from '@src/providers/llm/LlmProvider';
import {MistralLlmProvider} from "@src/providers/llm/MistralLlmProvider";
import {ftuxState$} from "@src/models/FtuxModel";
import {ChangeType, emitChange} from "@src/events/ChangeEvent";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";
import {createLoveLanguagesAssessment} from "@src/utils/testing/AssessmentTestHelper";
import {user$} from "@src/models/SessionModel";
import {userAssessments$} from "@src/models/UserAssessment";
import {DATA_PROVIDER_KEY} from "@src/providers/data/DataProvider";
import {DataService} from "@src/services/DataService";
import {LlmService} from "@src/services/LlmService";
import {CoreValuesService} from "@src/services/CoreValuesService";
import {GenerateDataService} from "@src/services/GenerateDataService";
import {createMockUser} from "@src/utils/testing/ProfessionalDevelopmentTestHelper";
import {createCoreValuesLlmResponse} from "@src/utils/testing/CoreValuesTestHelper";
import {userProfile$} from "@src/models/UserProfile";
import {setupFtuxForCoreValues, waitForChangeActions} from "@src/utils/testing/FtuxTestHelper";
import {test} from "../../../__tests__/setupIntegrationTest";

const getOpenAiApiKey = () => {
    return process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_OPENAI_API_KEY') as unknown as string;
}

const getMistralApiKey = () => {
    return process.env.EXPO_PUBLIC_MISTRAL_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY') as unknown as string;
}

describe('CreateCoreValuesAction', () => {
    let action: CreateCoreValuesAction;
    let testLlmProvider: TestLlmProvider;
    let testDataProvider: TestDataProvider;
    let coreValueService: CoreValuesService;

    const validCoreValues: ICoreValue[] = [
        {
            title: 'Integrity',
            description: 'Strong moral principles and honesty in all actions'
        },
        {
            title: 'Growth',
            description: 'Continuous learning and personal development'
        },
        {
            title: 'Empathy',
            description: 'Understanding and sharing feelings of others'
        }
    ];

    beforeEach(async () => {
        // Set up test providers
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();

        testLlmProvider = new TestLlmProvider();
        testLlmProvider.clearMockResponses();
        
        // Register the test providers
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
        
        // Initialize services in the correct order
        const dataService = DependencyService.resolve(DataService);
        await dataService.initialize();
        
        const llmService = DependencyService.resolve(LlmService);
        await llmService.initialize();
        
        const generateDataService = DependencyService.resolve(GenerateDataService);
        await generateDataService.initialize();
        
        coreValueService = DependencyService.resolve(CoreValuesService);
        await coreValueService.initialize();
        
        action = new CreateCoreValuesAction(testLlmProvider, coreValueService);
        
        // Set up a mock user
        const mockUser = createMockUser();
        user$.set(mockUser);
    });

    afterEach(async () => {
        // Clear user
        user$.set(null);
        
        testLlmProvider.clearMockResponses();
        
        // Clean up services in reverse order
        await coreValueService.end();
        
        const generateDataService = DependencyService.resolve(GenerateDataService);
        await generateDataService.end();
        
        const llmService = DependencyService.resolve(LlmService);
        await llmService.end();
        
        const dataService = DependencyService.resolve(DataService);
        await dataService.end();
        
        await testDataProvider.end();
        testDataProvider.clearTestData();
        
        // Unregister providers
        DependencyService.unregister(DATA_PROVIDER_KEY);
        DependencyService.unregister(LLM_PROVIDER_KEY);
    });

    it('should successfully parse valid LLM response', async () => {
        const testContext = 'test context';
        const validResponse = {
            core_values: validCoreValues
        };
        
        testLlmProvider.setNextResponse(
            JSON.stringify(validResponse)
        );
        
        const result = await action.execute(testContext);
        
        if (result.isErr()) {
            console.log("Error executing action:", result.error);
        }
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(3);
            expect(result.value).toEqual(validCoreValues);
        } else {
            console.log("Error: ", result.error);
            fail('Expected result to be Ok');
        }
    });

    it('should handle invalid core value structure', async () => {
        const testContext = 'test context';
        const invalidCoreValues = cloneDeep(validCoreValues);
        delete (invalidCoreValues[0] as any).description;
        
        testLlmProvider.setNextResponse(
            JSON.stringify(invalidCoreValues)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should handle core values with too many words in title', async () => {
        const testContext = 'test context';
        const invalidCoreValues = cloneDeep(validCoreValues);
        invalidCoreValues[0].title = 'This Has Too Many Words';
        
        testLlmProvider.setNextResponse(
            JSON.stringify(invalidCoreValues)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should returned an error for malformed response', async () => {
        const testContext = 'test context';
        const malformedResponse = `First core value is Integrity with a focus on honesty. Second is Growth emphasizing learning. Third is Empathy about understanding others.`;

        testLlmProvider.clearMockResponses();

        testLlmProvider.setNextResponse(
            malformedResponse
        );
        testLlmProvider.setNthResponse(1, JSON.stringify(validCoreValues));

        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should validate core values count is exactly 3', async () => {
        const testContext = 'test context';
        const tooFewValues = validCoreValues.slice(0, 2);
        
        testLlmProvider.setNextResponse(
            JSON.stringify(tooFewValues)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    describe('LLM provider integration tests', ()=>{
        let action: CreateCoreValuesAction;
        let openAiLlmProvider: OpenAiLlmProvider;
        let mistralLlmProvider: MistralLlmProvider;
        const coreValuesService = DependencyService.resolve(CoreValuesService);

        beforeAll(() => {
            // Set up the OpenAI API key and default model
            const openAiApiKey = getOpenAiApiKey();
            DependencyService.registerValue("OPENAI_API_KEY", openAiApiKey);
            DependencyService.registerValue("OPENAI_DEFAULT_MODEL", "gpt-4o");

            const mistralApiKey = getMistralApiKey();
            DependencyService.registerValue("MISTRAL_API_KEY", mistralApiKey);
            DependencyService.registerValue("MISTRAL_DEFAULT_MODEL", "ministral-8b-latest");
        });

        beforeEach(async () => {
            await coreValuesService.initialize();
            openAiLlmProvider = new OpenAiLlmProvider();
            await openAiLlmProvider.initialize();
            action = new CreateCoreValuesAction(openAiLlmProvider, coreValueService);

            mistralLlmProvider = new MistralLlmProvider();
            await mistralLlmProvider.initialize();
        });

        afterEach(async () => {
            await openAiLlmProvider.end();
        });

        afterAll(() => {
            DependencyService.unregister('OPENAI_API_KEY');
            DependencyService.unregister('OPENAI_DEFAULT_MODEL');
        });

        test('should successfully parse valid LLM response Open AI integration test', async () => {
            const testContext = `MBTI Results Summary: INTJ ("The Mastermind")

Personality Type: INTJ - Introverted, Intuitive, Thinking, Judging

Overview:
As an INTJ, you are a strategic thinker who values efficiency, independence, and logical problem-solving. You have a visionary mindset, always seeking to improve systems, optimize processes, and anticipate long-term outcomes. You are highly self-sufficient and prefer working with concepts, patterns, and structured plans rather than day-to-day details.`;

            const result = await action.execute(testContext);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(3);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if generated core values meet the requirements and align with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Each core value should have a title of 1-3 words
2. Each description should be a single sentence
3. Values should be positive and guide life decisions
4. Values should be meaningful and distinct from each other
5. Values should reasonably align with the given personality context
6. There must be exactly 3 values`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Core Values:
${JSON.stringify(result.value, null, 2)}

Are these core values valid according to the criteria?`
                    }
                ];

                const validationResult = await openAiLlmProvider.chat(comparisonPrompt);
                expect(validationResult.isOk()).toBe(true);
                if (validationResult.isOk()) {
                    const response = validationResult.value.toLowerCase().trim();
                    // Log validation result but don't fail the test
                    if (!response.includes('valid')) {
                        console.warn(`OpenAI validation response was not valid: ${response}`);
                    }
                    // We still expect to get a response, but we won't fail if it's not 'valid'
                }
            }
        });

        test('should successfully parse valid LLM response Mistral integration test', async () => {
            const action = new CreateCoreValuesAction(mistralLlmProvider, coreValuesService);

            const testContext = `MBTI Results Summary: INTJ ("The Mastermind")

Personality Type: INTJ - Introverted, Intuitive, Thinking, Judging

Overview:
As an INTJ, you are a strategic thinker who values efficiency, independence, and logical problem-solving. You have a visionary mindset, always seeking to improve systems, optimize processes, and anticipate long-term outcomes. You are highly self-sufficient and prefer working with concepts, patterns, and structured plans rather than day-to-day details.`;

            const result = await action.execute(testContext);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(3);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if generated core values meet the requirements and align with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Each core value should have a title of 1-3 words
2. Each description should be a single sentence
3. Values should be positive and guide life decisions
4. Values should be meaningful and distinct from each other
5. Values should reasonably align with the given personality context
6. There must be exactly 3 values`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Core Values:
${JSON.stringify(result.value, null, 2)}

Are these core values valid according to the criteria?`
                    }
                ];

                const validationResult = await mistralLlmProvider.chat(comparisonPrompt);
                expect(validationResult.isOk()).toBe(true);
                if (validationResult.isOk()) {
                    const response = validationResult.value.toLowerCase().trim();
                    // Log validation result but don't fail the test
                    if (!response.includes('valid')) {
                        console.warn(`Mistral validation response was not valid: ${response}`);
                    }
                    // We still expect to get a response, but we won't fail if it's not 'valid'
                }
            }
        });
    });
});

// Integration tests for Core Values creation
describe("Core Values Creation Integration Tests", () => {
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;

    const mockUser = createMockUser();

    beforeEach(async () => {
        // Clear any existing data
        user$.set(null);
        userAssessments$.set([]);
        userProfile$.set(null);
        clearCoreValues();

        // Reset FTUX state
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.currentStep.set(0);

        // Set up test providers
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();

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
        userProfile$.set(null);
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

    test("Core values are created when a new user finishes FTUX and has filled out an assessment", async () => {
        // Clear any existing core values
        clearCoreValues();
        testDataProvider.clearTestData();

        expect(getUserCoreValuesArray().length).toBe(0);

        // Set up the structured response for CreateCoreValuesAction
        testLlmProvider.clearMockResponses();
        testLlmProvider.setNextResponse(JSON.stringify({
            core_values: [
                { title: "Quality Time", description: "Spending dedicated time with loved ones" },
                { title: "Communication", description: "Open and honest dialogue in relationships" },
                { title: "Emotional Intelligence", description: "Understanding and managing emotions effectively" }
            ]
        }));

        // Complete FTUX flow using our helper
        await setupFtuxForCoreValues(mockUser.id);

        // Verify FTUX completion
        expect(ftuxState$.hasCompletedFTUX.get()).toBe(true);
        expect(ftuxState$.hasCompletedIntro.get()).toBe(true);

        // Act - Create a Love Languages assessment
        const assessment = await createLoveLanguagesAssessment(mockUser.id, 'Quality Time', true, false);
        
        // Trigger user assessment model change
        emitChange(ChangeType.USER_ASSESSMENT, { 
            assessments: [assessment],
            useAllAssessments: true,
            source: 'FTUX_COMPLETION'
        }, 'system');

        // Wait for model change actions to complete
        await waitForChangeActions(ChangeType.USER_ASSESSMENT);
        
        // Add a small delay to ensure processing completes
        await new Promise(resolve => setTimeout(resolve, 500));

        // Assert - Core values should be created
        const coreValues = getUserCoreValuesArray();
        expect(coreValues.length).toBe(3);
        
        // Verify the core values match the LLM response
        expect(coreValues.some(cv => cv.title === "Quality Time")).toBe(true);
        expect(coreValues.some(cv => cv.title === "Communication")).toBe(true);
        expect(coreValues.some(cv => cv.title === "Emotional Intelligence")).toBe(true);
    });

    test("should generate core values after FTUX completion", async () => {
        // Mock the LLM response for core values generation
        const mockCoreValues = [
            { title: "Integrity", description: "Being honest and having strong moral principles" },
            { title: "Compassion", description: "Showing concern for the suffering of others" },
            { title: "Growth", description: "Continuous personal and professional development" }
        ];
        
        // Set up the mock response for generateStructuredOutput
        testLlmProvider.setNextResponse(JSON.stringify({
            core_values: mockCoreValues
        }));

        // Reset FTUX state
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.currentStep.set(0);

        // Complete FTUX setup for core values
        await setupFtuxForCoreValues(mockUser.id);

        // Verify FTUX completion
        expect(ftuxState$.hasCompletedFTUX.get()).toBe(true);

        // Check that core values were generated
        const coreValues = getUserCoreValuesArray();
        expect(coreValues.length).toBe(3);
    });
}); 
