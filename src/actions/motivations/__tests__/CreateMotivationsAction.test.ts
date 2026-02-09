import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {CreateMotivationsAction} from "../CreateMotivationsAction";
import {IMotivation} from "@src/models/UserMotivation";
import {cloneDeep, get} from "lodash";
import {OpenAiLlmProvider} from "@src/providers/llm/OpenAiLlmProvider";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LlmMessage} from '@src/providers/llm/LlmProvider';
import {MistralLlmProvider} from "@src/providers/llm/MistralLlmProvider";

const runIntegrationTests = false;

const getOpenAiApiKey = () => {
    return process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_OPENAI_API_KEY') as unknown as string;
}

const getMistralApiKey = () => {
    return process.env.EXPO_PUBLIC_MISTRAL_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY') as unknown as string;
}

describe('CreateMotivationsAction', () => {
    let testLlmProvider: TestLlmProvider;
    let action: CreateMotivationsAction;

    const validMotivations: IMotivation[] = [
        {
            title: 'Creative Expression',
            description: 'Driven by the desire to bring innovative ideas to life.'
        },
        {
            title: 'Achievement',
            description: 'Motivated by setting and reaching ambitious goals.'
        },
        {
            title: 'Personal Growth',
            description: 'Energized by continuous learning and self-improvement.'
        }
    ];

    beforeEach(async () => {
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        action = new CreateMotivationsAction(testLlmProvider);
    });

    afterEach(async () => {
        await testLlmProvider.end();
        testLlmProvider.clearMockResponses();
    });

    it('should generate motivations successfully with structured output', async () => {
        const testContext = 'User is creative and ambitious.';
        testLlmProvider.setNextResponse(
            JSON.stringify({ entries: validMotivations})
        );

        const result = await action.execute(testContext);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(3);
            expect(result.value[0].title).toBe('Creative Expression');
            expect(result.value[1].title).toBe('Achievement');
            expect(result.value[2].title).toBe('Personal Growth');
        }
    });

    it('should handle invalid motivation structure', async () => {
        const testContext = 'User is creative and ambitious.';
        const invalidMotivations = cloneDeep(validMotivations);
        delete (invalidMotivations[0] as any).description;
        
        testLlmProvider.setNextResponse(
            JSON.stringify(invalidMotivations)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should handle motivations with too many words in title', async () => {
        const testContext = 'User is creative and ambitious.';
        const invalidMotivations = cloneDeep(validMotivations);
        invalidMotivations[0].title = 'This Has Too Many Words';
        
        testLlmProvider.setNextResponse(
            JSON.stringify(invalidMotivations)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should attempt to retry with malformed response', async () => {
        const testContext = 'User is creative and ambitious.';
        const malformedResponse = `First motivation is Creative Expression focusing on innovation. Second is Achievement about goals. Third is Growth about learning.`;

        testLlmProvider.clearMockResponses();
        testLlmProvider.setSupportsStructuredOutputs(false);
        testLlmProvider.setSupportsJsonResultOutput(false);

        testLlmProvider.setNextResponse(
            malformedResponse
        );
        testLlmProvider.setNthResponse(1,
            JSON.stringify({ entries: validMotivations })
        );
        
        const result = await action.execute(testContext);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(3);
            expect(result.value).toEqual(validMotivations);
        }

        // Reset provider capabilities
        testLlmProvider.setSupportsStructuredOutputs(true);
        testLlmProvider.setSupportsJsonResultOutput(true);
    });

    it('should validate motivations count is exactly 3', async () => {
        const testContext = 'User is creative and ambitious.';
        const tooFewMotivations = validMotivations.slice(0, 2);
        
        testLlmProvider.setNextResponse(
            JSON.stringify(tooFewMotivations)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    describe('LLM provider integration tests', () => {
        let openAiLlmProvider: OpenAiLlmProvider;
        let mistralLlmProvider: MistralLlmProvider;

        const test = runIntegrationTests ? it : it.skip;

        beforeAll(() => {
            if (!runIntegrationTests) return;
            // Set up the OpenAI API key and default model
            const openAiApiKey = getOpenAiApiKey();
            DependencyService.registerValue("OPENAI_API_KEY", openAiApiKey);
            DependencyService.registerValue("OPENAI_DEFAULT_MODEL", "gpt-4o");

            const mistralApiKey = getMistralApiKey();
            DependencyService.registerValue("MISTRAL_API_KEY", mistralApiKey);
            DependencyService.registerValue("MISTRAL_DEFAULT_MODEL", "mistral-medium");
        });

        beforeEach(async () => {
            if (!runIntegrationTests) return;
            openAiLlmProvider = new OpenAiLlmProvider();
            await openAiLlmProvider.initialize();
            action = new CreateMotivationsAction(openAiLlmProvider);

            mistralLlmProvider = new MistralLlmProvider();
            await mistralLlmProvider.initialize();
        });

        afterEach(async () => {
            if (!runIntegrationTests) return;
            await openAiLlmProvider.end();
            await mistralLlmProvider.end();
        });

        afterAll(() => {
            if (!runIntegrationTests) return;
            DependencyService.unregister('OPENAI_API_KEY');
            DependencyService.unregister('OPENAI_DEFAULT_MODEL');
            DependencyService.unregister('MISTRAL_API_KEY');
            DependencyService.unregister('MISTRAL_DEFAULT_MODEL');
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
                        content: `You are a validator checking if generated motivations meet the requirements and align with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Each motivation should have a title of 1-3 words
2. Each description should be a single sentence
3. Motivations should be positive and guide life decisions
4. Motivations should be meaningful and distinct from each other
5. Motivations should reasonably align with the given personality context
6. There must be exactly 3 motivations`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Motivations:
${JSON.stringify(result.value, null, 2)}

Are these motivations valid according to the criteria?`
                    }
                ];

                const validationResult = await openAiLlmProvider.chat(comparisonPrompt);
                expect(validationResult.isOk()).toBe(true);
                if (validationResult.isOk()) {
                    const response = validationResult.value.toLowerCase().trim();
                    expect(response).toBe('valid');
                }
            }
        }, 100_000);

        test('should successfully parse valid LLM response Mistral integration test', async () => {
            const mistralAction = new CreateMotivationsAction(mistralLlmProvider);

            const testContext = `MBTI Results Summary: INTJ ("The Mastermind")

Personality Type: INTJ - Introverted, Intuitive, Thinking, Judging

Overview:
As an INTJ, you are a strategic thinker who values efficiency, independence, and logical problem-solving. You have a visionary mindset, always seeking to improve systems, optimize processes, and anticipate long-term outcomes. You are highly self-sufficient and prefer working with concepts, patterns, and structured plans rather than day-to-day details.`;

            const result = await mistralAction.execute(testContext);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(3);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if generated motivations meet the requirements and align with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Each motivation should have a title of 1-3 words
2. Each description should be a single sentence
3. Motivations should be positive and guide life decisions
4. Motivations should be meaningful and distinct from each other
5. Motivations should reasonably align with the given personality context
6. There must be exactly 3 motivations`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Motivations:
${JSON.stringify(result.value, null, 2)}

Are these motivations valid according to the criteria?`
                    }
                ];

                const validationResult = await openAiLlmProvider.chat(comparisonPrompt);
                expect(validationResult.isOk()).toBe(true);
                if (validationResult.isOk()) {
                    const response = validationResult.value.toLowerCase().trim();
                    expect(response).toBe('valid');
                }
            }
        }, 100_000);
    });
}); 