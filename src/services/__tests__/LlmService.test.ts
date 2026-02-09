import {LlmService} from '../LlmService';
import {TestLlmProvider} from '@src/providers/llm/__tests__/TestLlmProvider';
import {DependencyService} from "@src/core/injection/DependencyService";
import {LLM_PROVIDER_KEY, LlmMessage} from '@src/providers/llm/LlmProvider';
import {userAssessments$} from "@src/models/UserAssessment";
import {CoreValueType, userCoreValues$} from "@src/models/UserCoreValue";
import {userInnerCircle$} from "@src/models/UserInnerCircle";
import {userMainInterests$} from "@src/models/UserMainInterest";
import {professionalDevelopment$} from "@src/models/ProfessionalDevelopment";
import {userLongTermGoals$} from "@src/models/UserLongTermGoal";
import {userShortTermGoals$} from "@src/models/UserShortTermGoal";
import {userWeaknesses$, WeaknessType} from "@src/models/UserWeakness";

describe('LlmService', () => {
    let llmService: LlmService;
    let testLlmProvider: TestLlmProvider;

    beforeEach(async () => {
        // Create and initialize the test provider
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        
        // Register the provider
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
        
        // Create and initialize the service
        llmService = new LlmService();
        await llmService.initialize();

        // Set up mock data
        userAssessments$.set([{
            id: '1',
            user_id: 'user1',
            assessment_type: 'personality',
            assessment_summary: 'Very extroverted',
            assessment_full_text: 'Full assessment text',
            name: 'Personality Assessment',
            created_at: '2024-01-01',
            updated_at: '2024-01-01'
        }]);

        userCoreValues$.set({
            '1': {
                id: '1',
                user_id: 'user1',
                title: 'Honesty',
                description: 'Being truthful',
                value_type: CoreValueType.SYSTEM_GENERATED,
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }
        });

        userInnerCircle$.set([{
            id: '1',
            user_id: 'user1',
            name: 'John',
            relationship_type: 'Friend',
            created_at: new Date(),
            updated_at: new Date()
        }]);

        userMainInterests$.set({
            '1': {
                id: '1',
                user_id: 'user1',
                interest: 'Programming',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }
        });

        professionalDevelopment$.set({
            id: '1',
            user_id: 'user1',
            key_terms: ['Leadership', 'Communication'],
            description: 'Professional development description',
            leadership_style_title: 'Democratic Leader',
            leadership_style_description: 'Leadership style description',
            goal_setting_style_title: 'SMART Goals',
            goal_setting_style_description: 'Goal setting style description',
            created_at: '2024-01-01',
            updated_at: '2024-01-01'
        });

        userLongTermGoals$.set({
            '1': {
                id: '1',
                user_id: 'user1',
                goal: 'Become a tech lead',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }
        });

        userShortTermGoals$.set({
            '1': {
                id: '1',
                user_id: 'user1',
                goal: 'Learn TypeScript',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }
        });

        userWeaknesses$.set({
            '1': {
                id: '1',
                user_id: 'user1',
                title: 'Public Speaking',
                description: 'Need to improve public speaking',
                weakness_type: WeaknessType.SYSTEM_GENERATED,
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            }
        });
    });

    afterEach(async () => {
        await llmService.end();
        await testLlmProvider.end();
        testLlmProvider.setShouldFailInit(false);
        testLlmProvider.clearMockResponses();
        jest.clearAllMocks();
        userAssessments$.set([]);
        userCoreValues$.set(null);
        userInnerCircle$.set([]);
        userMainInterests$.set(null);
        professionalDevelopment$.set(null);
        userLongTermGoals$.set(null);
        userShortTermGoals$.set(null);
        userWeaknesses$.set(null);
    });

    describe('Model Configuration', () => {
        it('should return default model configuration', () => {
            const result = llmService.getDefaultModel();
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.modelName).toBe('test-small');
                expect(result.value.temperature).toBe(0.7);
                expect(result.value.maxTokens).toBe(1024);
            }
        });

        it('should return available models', () => {
            const result = llmService.getAvailableModels();
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(['test-small', 'test-medium', 'test-large']);
            }
        });
    });

    describe('Chat', () => {
        it('should generate chat response with mock data', async () => {
            const prompt = 'Hello, how are you?';
            const expectedResponse = 'I am doing well, thank you for asking!';
            testLlmProvider.setMockResponse(prompt, expectedResponse);

            const messages: LlmMessage[] = [
                { role: 'user', content: prompt }
            ];

            const result = await llmService.chat(messages);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(expectedResponse);
            }
        });

        it('should generate random response when no mock is provided', async () => {
            const messages: LlmMessage[] = [
                { role: 'user', content: 'Tell me a joke' }
            ];

            const result = await llmService.chat(messages);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeDefined();
                expect(result.value.length).toBeGreaterThan(0);
            }
        });

        it('should handle streaming chat response', async () => {
            const messages: LlmMessage[] = [
                { role: 'user', content: 'Stream a response' }
            ];

            const result = await llmService.chatStream(messages);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeDefined();
                expect(result.value.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Image Processing', () => {
        it('should generate image summary', async () => {
            const expectedResponse = 'Test OCR result';
            testLlmProvider.setMockResponse('image_summary', expectedResponse);

            const result = await llmService.generateImageSummary('base64-image-data', 'image/png');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(expectedResponse);
            }
        });

        it('should generate default image summary when no mock is provided', async () => {
            const result = await llmService.generateImageSummary('base64-image-data', 'image/png');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('test OCR response');
            }
        });
    });

    describe('Summary Generation', () => {
        it('should generate summary with mock response', async () => {
            const inputText = 'User profile text';
            const expectedSummary = 'Generated summary of user profile';
            testLlmProvider.setMockResponse(inputText, expectedSummary);

            const result = await llmService.generateSummary(inputText);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(expectedSummary);
            }
        });

        it('should generate random summary when no mock is provided', async () => {
            const result = await llmService.generateSummary('User profile text');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeDefined();
                expect(result.value.length).toBeGreaterThan(0);
            }
        });
    });

    describe('Core Values Generation', () => {
        it('should generate core values with valid JSON response', async () => {
            const context = 'User context for core values';
            const validResponse = JSON.stringify([
                { title: "Value One", description: "First core value description." },
                { title: "Value Two", description: "Second core value description." },
                { title: "Value Three", description: "Third core value description." }
            ]);

            testLlmProvider.setNextResponse(validResponse);

            const result = await llmService.generateCoreValues(context);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(3);
                expect(result.value[0]).toHaveProperty('title');
                expect(result.value[0]).toHaveProperty('description');
                expect(result.value[0].title.split(' ').length).toBeLessThanOrEqual(3);
            }
        });

        it('should handle invalid JSON response and retry successfully', async () => {
            testLlmProvider.clearMockResponses();
            testLlmProvider.setSupportsStructuredOutputs(false);
            testLlmProvider.setSupportsJsonResultOutput(false);

            const context = 'User context for core values';
            const invalidResponse = 'Invalid response format';
            const validResponse = JSON.stringify([
                { title: "Value One", description: "First core value description." },
                { title: "Value Two", description: "Second core value description." },
                { title: "Value Three", description: "Third core value description." }
            ]);

            // Set up the mock to return invalid response first, then valid response on retry
            testLlmProvider.setNextResponse(invalidResponse);
            testLlmProvider.setNthResponse(1, validResponse);

            const result = await llmService.generateCoreValues(context);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(3);
                expect(result.value[0]).toHaveProperty('title');
                expect(result.value[0]).toHaveProperty('description');
            }
            testLlmProvider.setSupportsJsonResultOutput(true);
            testLlmProvider.setSupportsStructuredOutputs(true);
        });

        it('should handle invalid JSON response and fail after retry', async () => {
            const context = 'User context for core values';
            const invalidResponse = 'Invalid response format';
            const stillInvalidResponse = 'Still invalid format';

            testLlmProvider.clearMockResponses();

            // Set up the mock to return invalid responses both times
            testLlmProvider.setNextResponse(invalidResponse);
            testLlmProvider.setNthResponse(1, stillInvalidResponse);

            const result = await llmService.generateCoreValues(context);
            expect(result.isErr()).toBe(true);
        });

        it('should validate title length is 1-3 words', async () => {
            const context = 'User context for core values';
            const validResponse = JSON.stringify([
                { title: "One", description: "First description." },
                { title: "One Two", description: "Second description." },
                { title: "One Two Three", description: "Third description." }
            ]);
            testLlmProvider.setNextResponse(validResponse);

            const result = await llmService.generateCoreValues(context);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                result.value.forEach(value => {
                    expect(value.title.split(' ').length).toBeLessThanOrEqual(3);
                    expect(value.title.split(' ').length).toBeGreaterThan(0);
                });
            }
        });

        it('should reject response with more than 3 words in title', async () => {
            const context = 'User context for core values';
            const invalidResponse = JSON.stringify([
                { title: "One Two Three Four", description: "First description." },
                { title: "Value Two", description: "Second description." },
                { title: "Value Three", description: "Third description." }
            ]);
            testLlmProvider.setNextResponse(invalidResponse);

            const result = await llmService.generateCoreValues(context);
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle custom delay in responses', async () => {
            const customDelay = 50;
            testLlmProvider.setDefaultDelay(customDelay);
            
            const startTime = Date.now();
            await llmService.chat([{ role: 'user', content: 'Quick response' }]);
            const endTime = Date.now();
            
            const actualDelay = endTime - startTime;
            expect(actualDelay).toBeGreaterThanOrEqual(customDelay * 0.5);
            expect(actualDelay).toBeLessThanOrEqual(customDelay * 1.75);
        });
    });

    it('should prepend context messages to chat', async () => {
        const testMessage: LlmMessage = {
            role: 'user',
            content: 'test message'
        };

        const result = await llmService.chat([testMessage]);
        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
            const messages = JSON.parse(result.value) as LlmMessage[];
            expect(messages.length).toBeGreaterThan(1);
            expect(messages[0].role).toBe('system');
            expect(messages[1].role).toBe('user');
            expect(messages[1].content).toContain('This is the background for the user');
            expect(messages[2]).toEqual(testMessage);

            // Verify context content
            const contextMessage = messages[1].content;
            expect(contextMessage).toContain('personality: Very extroverted');
            expect(contextMessage).toContain('Honesty');
            expect(contextMessage).toContain('Friend: John');
            expect(contextMessage).toContain('Programming');
            expect(contextMessage).toContain('Democratic Leader');
            expect(contextMessage).toContain('SMART Goals');
            expect(contextMessage).toContain('Become a tech lead');
            expect(contextMessage).toContain('Learn TypeScript');
            expect(contextMessage).toContain('Public Speaking');
        }
    });

    it('should prepend context messages to chatStream', async () => {
        const testMessage: LlmMessage = {
            role: 'user',
            content: 'test message'
        };

        const result = await llmService.chatStream([testMessage]);
        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
            const messages = JSON.parse(result.value) as LlmMessage[];
            expect(messages.length).toBeGreaterThan(1);
            expect(messages[0].role).toBe('system');
            expect(messages[1].role).toBe('user');
            expect(messages[2]).toEqual(testMessage);
        }
    });

    it('should handle empty user data', async () => {
        // Clear all user data
        userAssessments$.set([]);
        userCoreValues$.set(null);
        userInnerCircle$.set([]);
        userMainInterests$.set(null);
        professionalDevelopment$.set(null);
        userLongTermGoals$.set(null);
        userShortTermGoals$.set(null);
        userWeaknesses$.set(null);

        const testMessage: LlmMessage = {
            role: 'user',
            content: 'test message'
        };

        const result = await llmService.chat([testMessage]);
        expect(result.isOk()).toBe(true);

        if (result.isOk()) {
            const messages = JSON.parse(result.value) as LlmMessage[];
            expect(messages.length).toBeGreaterThan(1);
            expect(messages[0].role).toBe('system');
            expect(messages[1].role).toBe('user');
            expect(messages[1].content).toContain('This is the background for the user');
            expect(messages[2]).toEqual(testMessage);
        }
    });
}); 