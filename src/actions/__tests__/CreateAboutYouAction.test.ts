import {CreateAboutYouAction} from '../aboutYou/CreateAboutYouAction';
import {TestLlmProvider} from '@src/providers/llm/__tests__/TestLlmProvider';
import {AboutYouSectionType} from '@src/models/UserAboutYou';
import {aboutYouUserContextPrompt, retryAboutYouPrompt} from '@src/prompts/AboutYouPrompts';
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

describe('CreateAboutYouAction', () => {
    let action: CreateAboutYouAction;
    let testLlmProvider: TestLlmProvider;

    const validEntries = {
        entries: [
            {
                title: 'Communication Style',
                description: 'You have a direct and assertive communication style, preferring clear and concise exchanges.'
            },
            {
                title: 'Empathy Level',
                description: 'You show strong empathy in relationships with others.'
            },
            {
                title: 'Conflict Resolution',
                description: 'You approach conflicts with a logical and solution-oriented mindset.'
            },
            {
                title: 'Relationship Building',
                description: 'You build trust through consistent and reliable interactions.'
            },
            {
                title: 'Social Awareness',
                description: 'You demonstrate keen awareness of social dynamics and others\' needs.'
            }
        ]
    };

    beforeEach(async () => {
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        action = new CreateAboutYouAction(testLlmProvider, AboutYouSectionType.SELF_AWARENESS);
    });

    afterEach(async () => {
        await testLlmProvider.end();
        testLlmProvider.clearMockResponses();
    });

    it('should successfully parse valid LLM response', async () => {
        const testContext = 'test context';
        testLlmProvider.setMockResponse(
            aboutYouUserContextPrompt(testContext).content,
            JSON.stringify(validEntries)
        );
        
        const result = await action.execute(testContext);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(5);
            expect(result.value[0].title).toBe(validEntries.entries[0].title);
            expect(result.value[0].description).toBe(validEntries.entries[0].description);
        }
    });

    it('should handle invalid entry structure', async () => {
        const testContext = 'test context';
        const invalidEntries = cloneDeep(validEntries);
        delete (invalidEntries.entries[0] as any).description;
        
        testLlmProvider.setMockResponse(
            aboutYouUserContextPrompt(testContext).content,
            JSON.stringify(invalidEntries)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should handle entry with too many words in title', async () => {
        const testContext = 'test context';
        const invalidEntries = cloneDeep(validEntries);
        invalidEntries.entries[0].title = `This Title Has Way Too Many Words In It ${new Array(50).fill('word').join(' ')}}`;
        
        testLlmProvider.setMockResponse(
            aboutYouUserContextPrompt(testContext).content,
            JSON.stringify(invalidEntries)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should return an error for malformed response', async () => {
        const testContext = 'test context';
        const malformedResponse = `The user has a direct communication style and prefers clear exchanges.`;

        testLlmProvider.clearMockResponses();

        testLlmProvider.setMockResponse(
            aboutYouUserContextPrompt(testContext).content,
            malformedResponse
        );
        testLlmProvider.setMockResponse(
            retryAboutYouPrompt().content,
            JSON.stringify(validEntries)
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should handle different section types correctly', async () => {
        const testContext = 'test context';
        const relationshipsEntries = {
            entries: [
                {
                    title: 'Empathy in Relationships',
                    description: 'You show strong empathy and understanding in your relationships with others.'
                },
                {
                    title: 'Communication',
                    description: 'You communicate effectively in personal relationships.'
                },
                {
                    title: 'Trust Building',
                    description: 'You build trust through consistent actions and reliability.'
                },
                {
                    title: 'Conflict Management',
                    description: 'You handle conflicts with patience and understanding.'
                },
                {
                    title: 'Emotional Support',
                    description: 'You provide strong emotional support to others.'
                }
            ]
        };

        const relationshipsAction = new CreateAboutYouAction(testLlmProvider, AboutYouSectionType.RELATIONSHIPS);
        
        testLlmProvider.setMockResponse(
            aboutYouUserContextPrompt(testContext).content,
            JSON.stringify(relationshipsEntries)
        );
        
        const result = await relationshipsAction.execute(testContext);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(5);
            expect(result.value[0].title).toBe(relationshipsEntries.entries[0].title);
            expect(result.value[0].description).toBe(relationshipsEntries.entries[0].description);
        }
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
            action = new CreateAboutYouAction(openAiLlmProvider, AboutYouSectionType.SELF_AWARENESS);

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
                expect(result.value).toHaveLength(5);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if generated about you entries meet the requirements and align with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Each entry should have a title of max 50 characters
2. Each description should be 1-2 sentences
3. Entries should be meaningful and distinct from each other
4. Entries should reasonably align with the given personality context
5. There must be exactly 5 entries
6. Entries should focus on communication style, empathy, and relationship aspects`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated About You Entries:
${JSON.stringify(result.value, null, 2)}

Are these entries valid according to the criteria?`
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
            const mistralAction = new CreateAboutYouAction(mistralLlmProvider, AboutYouSectionType.SELF_AWARENESS);

            const testContext = `MBTI Results Summary: INTJ ("The Mastermind")

Personality Type: INTJ - Introverted, Intuitive, Thinking, Judging

Overview:
As an INTJ, you are a strategic thinker who values efficiency, independence, and logical problem-solving. You have a visionary mindset, always seeking to improve systems, optimize processes, and anticipate long-term outcomes. You are highly self-sufficient and prefer working with concepts, patterns, and structured plans rather than day-to-day details.`;

            const result = await mistralAction.execute(testContext);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(5);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if generated about you entries meet the requirements and align with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Each entry should have a title of max 50 characters
2. Each description should be 1-2 sentences
3. Entries should be meaningful and distinct from each other
4. Entries should reasonably align with the given personality context
5. There must be exactly 5 entries
6. Entries should focus on communication style, empathy, and relationship aspects`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated About You Entries:
${JSON.stringify(result.value, null, 2)}

Are these entries valid according to the criteria?`
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