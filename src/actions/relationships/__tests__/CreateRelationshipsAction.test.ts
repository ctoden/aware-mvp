import {DependencyService} from "@src/core/injection/DependencyService";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {LlmMessage, LlmMessageProcessor} from "@src/providers/llm/LlmProvider";
import {MistralLlmProvider} from "@src/providers/llm/MistralLlmProvider";
import {OpenAiLlmProvider} from "@src/providers/llm/OpenAiLlmProvider";
import {get} from "lodash";
import {CreateRelationshipsAction} from "../CreateRelationshipsAction";
import {ok, Result} from "neverthrow";

const runIntegrationTests = true;

const getOpenAiApiKey = () => {
    return process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_OPENAI_API_KEY') as unknown as string;
};

const getMistralApiKey = () => {
    return process.env.EXPO_PUBLIC_MISTRAL_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY') as unknown as string;
};

describe('CreateRelationshipsAction', () => {
    const test = runIntegrationTests ? it : it.skip;

    let testLlmProvider: TestLlmProvider;
    let action: CreateRelationshipsAction;

    const validKeyTerms = {
        entries: {
            key_terms: ['Empathetic', 'Intuitive', 'Assertive', 'Optimistic', 'Self-aware']
        }
    };

    const validDescription = {
        entries: {
            description: 'You thrive in relationships where your independence and intellectual curiosity are respected.'
        }
    };

    const validCommunicationStyle = {
        entries: {
            title: 'Assertive',
            description: 'You communicate directly and honestly while respecting others boundaries.'
        }
    };

    const validConflictStyle = {
        entries: {
            title: 'Collaborating',
            description: 'You seek win-win solutions through open dialogue and mutual understanding.'
        }
    };

    const validAttachmentStyle = {
        entries: {
            title: 'Secure',
            description: 'You form stable emotional bonds while maintaining healthy independence.'
        }
    };

    beforeEach(async () => {
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        action = new CreateRelationshipsAction(testLlmProvider);
    });

    afterEach(async () => {
        await testLlmProvider.end();
        testLlmProvider.clearMockResponses();
    });

    it('should handle invalid key terms structure', async () => {
        const invalidKeyTerms = {
            entries: {
                key_terms: ['Term1', 'Term2'] // Only 2 terms instead of required 5
            }
        };
        
        testLlmProvider.setNextResponse(
            JSON.stringify(invalidKeyTerms)
        );

        const result = await action.execute();
        expect(result.isErr()).toBe(true);
    });

    it('should handle empty required fields', async () => {
        const invalidDescription = {
            entries: {
                description: ''
            }
        };
        
        testLlmProvider.setNextResponse(
            JSON.stringify(validKeyTerms)
        );

        testLlmProvider.setNthResponse(1,
            JSON.stringify(invalidDescription)
        );

        const result = await action.execute();
        expect(result.isErr()).toBe(true);
    });

    describe('LLM provider integration tests', () => {
        let openAiLlmProvider: OpenAiLlmProvider;
        let mistralLlmProvider: MistralLlmProvider;

        beforeAll(() => {
            if (!runIntegrationTests) return;
            const openAiApiKey = getOpenAiApiKey();
            DependencyService.registerValue("OPENAI_API_KEY", openAiApiKey);
            DependencyService.registerValue("OPENAI_DEFAULT_MODEL", "gpt-4o");

            const mistralApiKey = getMistralApiKey();
            DependencyService.registerValue("MISTRAL_API_KEY", mistralApiKey);
            DependencyService.registerValue("MISTRAL_DEFAULT_MODEL", "ministral-8b-latest");
        });

        beforeEach(async () => {
            if (!runIntegrationTests) return;
            openAiLlmProvider = new OpenAiLlmProvider();
            await openAiLlmProvider.initialize();

            mistralLlmProvider = new MistralLlmProvider();
            await mistralLlmProvider.initialize();

            openAiLlmProvider.removeAllPreProcessors();
            mistralLlmProvider.removeAllPreProcessors();
            openAiLlmProvider.removeAllPostProcessors();
            mistralLlmProvider.removeAllPostProcessors();
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

        test('should successfully parse valid LLM response OpenAI integration test', async () => {
            const openAiAction = new CreateRelationshipsAction(openAiLlmProvider);
            const testContext = `MBTI Results Summary: INTJ ("The Mastermind")

Personality Type: INTJ - Introverted, Intuitive, Thinking, Judging

Overview:
As an INTJ, you are a strategic thinker who values efficiency, independence, and logical problem-solving. 
You have a visionary mindset, always seeking to improve systems and anticipate long-term outcomes. 
You are highly self-sufficient and prefer working with concepts and patterns.`;

            const preProcess: LlmMessageProcessor = async (messages: LlmMessage[]): Promise<Result<LlmMessage[], Error>> => {
                const contextMessage: LlmMessage = {
                    role: 'user',
                    content: testContext
                };
                return ok([contextMessage, ...messages]);
            };
            openAiLlmProvider.registerPreProcessor(preProcess);

            const result = await openAiAction.execute();

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const value = result.value as Required<typeof result.value>;
                expect(value.key_terms).toHaveLength(5);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'user',
                        content: `You are a validator checking if the generated relationships profile meets the requirements and aligns with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Must have exactly 5 key terms that are meaningful and distinct
2. Description should be concise (max 2 sentences) and forward-looking
3. Communication style must be one of: Assertive, Passive, Passive-Aggressive, Aggressive
4. Conflict resolution style must be one of: Avoiding, Accommodating, Competitive, Compromising, Collaborating
5. Attachment style must be one of: Secure, Anxious, Avoidant, Fearful-Avoidant
6. All descriptions should be meaningful and align with the personality context`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Profile:
${JSON.stringify(value, null, 2)}

Is this profile valid according to the criteria?`
                    }
                ];

                openAiLlmProvider.removeAllPreProcessors();

                const validationResult = await openAiLlmProvider.chat(comparisonPrompt);
                expect(validationResult.isOk()).toBe(true);
                if (validationResult.isOk()) {
                    const response = validationResult.value.toLowerCase().trim();
                    expect(response).toBe('valid');
                }
            }
        }, 100_000);

        test('should successfully parse valid LLM response Mistral integration test', async () => {
            const mistralAction = new CreateRelationshipsAction(mistralLlmProvider);
            const testContext = `MBTI Results Summary: INTJ ("The Mastermind")

Personality Type: INTJ - Introverted, Intuitive, Thinking, Judging

Overview:
As an INTJ, you are a strategic thinker who values efficiency, independence, and logical problem-solving. 
You have a visionary mindset, always seeking to improve systems and anticipate long-term outcomes. 
You are highly self-sufficient and prefer working with concepts and patterns.`;

            const preProcess: LlmMessageProcessor = async (messages: LlmMessage[]): Promise<Result<LlmMessage[], Error>> => {
                const contextMessage: LlmMessage = {
                    role: 'user',
                    content: testContext
                };
                return ok([contextMessage, ...messages]);
            };
            mistralLlmProvider.registerPreProcessor(preProcess);

            const result = await mistralAction.execute();

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const value = result.value as Required<typeof result.value>;
                expect(value.key_terms).toHaveLength(5);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'user',
                        content: `You are a validator checking if the generated relationships profile meets the requirements and aligns with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Must have exactly 5 key terms that are meaningful and distinct
2. Description should be concise (max 2 sentences) and forward-looking
3. Communication style must be one of: Assertive, Passive, Passive-Aggressive, Aggressive
4. Conflict resolution style must be one of: Avoiding, Accommodating, Competitive, Compromising, Collaborating
5. Attachment style must be one of: Secure, Anxious, Avoidant, Fearful-Avoidant
6. All descriptions should be meaningful and align with the personality context`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Profile:
${JSON.stringify(value, null, 2)}

Is this profile valid according to the criteria?`
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