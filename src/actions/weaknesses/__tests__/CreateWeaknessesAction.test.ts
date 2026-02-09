import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {CreateWeaknessesAction} from "../CreateWeaknessesAction";
import {cloneDeep, get} from "lodash";
import {OpenAiLlmProvider} from "@src/providers/llm/OpenAiLlmProvider";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LlmMessage} from '@src/providers/llm/LlmProvider';
import {MistralLlmProvider} from "@src/providers/llm/MistralLlmProvider";

const runIntegrationTests = true;

const getOpenAiApiKey = () => {
    return process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_OPENAI_API_KEY') as unknown as string;
};

const getMistralApiKey = () => {
    return process.env.EXPO_PUBLIC_MISTRAL_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY') as unknown as string;
};

describe('CreateWeaknessesAction', () => {
    let testLlmProvider: TestLlmProvider;
    let action: CreateWeaknessesAction;

    const validWeaknesses = {
        entries: [
            {
                title: 'Time Management',
                description: 'You sometimes struggle to prioritize tasks effectively, though you\'re actively working on improving your organizational skills.'
            },
            {
                title: 'Public Speaking',
                description: 'You feel less confident when presenting to large groups, but your preparation and practice are steadily building your comfort level.'
            },
            {
                title: 'Detail Focus',
                description: 'Your big-picture thinking occasionally leads to overlooking smaller details, though this same trait enables creative problem-solving.'
            },
            {
                title: 'Decision Making',
                description: 'You tend to spend extra time weighing options before making decisions, but this thoroughness often leads to better outcomes.'
            }
        ]
    };

    beforeEach(async () => {
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        action = new CreateWeaknessesAction(testLlmProvider);
    });

    afterEach(async () => {
        await testLlmProvider.end();
        testLlmProvider.clearMockResponses();
    });

    it('should generate weaknesses successfully with structured output', async () => {
        const testContext = 'User is creative and ambitious.';
        testLlmProvider.setNextResponse(JSON.stringify(validWeaknesses));

        const result = await action.execute(testContext);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(4);
            expect(result.value[0].title).toBe('Time Management');
            expect(result.value[1].title).toBe('Public Speaking');
            expect(result.value[2].title).toBe('Detail Focus');
            expect(result.value[3].title).toBe('Decision Making');
        }
    });

    it('should handle invalid weakness structure', async () => {
        const testContext = 'User is creative and ambitious.';
        const invalidWeaknesses = cloneDeep(validWeaknesses);
        delete (invalidWeaknesses.entries[0] as any).description;
        
        testLlmProvider.setNextResponse(JSON.stringify(invalidWeaknesses));
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should handle weaknesses with too many words in title', async () => {
        const testContext = 'User is creative and ambitious.';
        const invalidWeaknesses = cloneDeep(validWeaknesses);
        invalidWeaknesses.entries[0].title = 'This Has Too Many Words';
        
        testLlmProvider.setNextResponse(JSON.stringify(invalidWeaknesses));
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should attempt to retry with malformed response', async () => {
        const testContext = 'User is creative and ambitious.';
        const malformedResponse = `First weakness is Time Management, struggling with prioritization. Second is Public Speaking with confidence issues. Third is Detail Focus with oversight problems. Fourth is Decision Making with slow choices.`;

        testLlmProvider.clearMockResponses();
        testLlmProvider.setSupportsStructuredOutputs(false);
        testLlmProvider.setSupportsJsonResultOutput(false);

        testLlmProvider.setNextResponse(malformedResponse);
        testLlmProvider.setNthResponse(1, JSON.stringify(validWeaknesses));
        
        const result = await action.execute(testContext);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(4);
            expect(result.value).toEqual(validWeaknesses.entries);
        }

        // Reset provider capabilities
        testLlmProvider.setSupportsStructuredOutputs(true);
        testLlmProvider.setSupportsJsonResultOutput(true);
    });

    it('should validate weaknesses count is exactly 4', async () => {
        const testContext = 'User is creative and ambitious.';
        const tooFewWeaknesses = cloneDeep(validWeaknesses);
        tooFewWeaknesses.entries = tooFewWeaknesses.entries.slice(0, 3);
        
        testLlmProvider.setNextResponse(JSON.stringify(tooFewWeaknesses));
        
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
            action = new CreateWeaknessesAction(openAiLlmProvider);

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
                expect(result.value).toHaveLength(4);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if generated weaknesses meet the requirements and align with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Each weakness should have a title of 1-3 words
2. Each description should be a single sentence
3. Weaknesses should be meaningful and distinct from each other
4. Weaknesses should reasonably align with the given personality context
5. There must be exactly 4 weaknesses
6. Each weakness should maintain an optimistic tone`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Weaknesses:
${JSON.stringify(result.value, null, 2)}

Are these weaknesses valid according to the criteria?`
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
            const mistralAction = new CreateWeaknessesAction(mistralLlmProvider);

            const testContext = `MBTI Results Summary: INTJ ("The Mastermind")

Personality Type: INTJ - Introverted, Intuitive, Thinking, Judging

Overview:
As an INTJ, you are a strategic thinker who values efficiency, independence, and logical problem-solving. You have a visionary mindset, always seeking to improve systems, optimize processes, and anticipate long-term outcomes. You are highly self-sufficient and prefer working with concepts, patterns, and structured plans rather than day-to-day details.`;

            const result = await mistralAction.execute(testContext);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(4);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if generated weaknesses meet the requirements and align with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Each weakness should have a title of 1-3 words
2. Each description should be a single sentence
3. Weaknesses should be meaningful and distinct from each other
4. Weaknesses should reasonably align with the given personality context
5. There must be exactly 4 weaknesses
6. Each weakness should maintain an optimistic tone`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Weaknesses:
${JSON.stringify(result.value, null, 2)}

Are these weaknesses valid according to the criteria?`
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