import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {
    CreateProfessionalDevelopmentAction,
    ProfessionalDevelopmentLlmResponse
} from "../CreateProfessionalDevelopmentAction";
import {retryProfessionalDevelopmentPrompt} from "@src/prompts/ProfessionalDevelopment";
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

describe('CreateProfessionalDevelopmentAction', () => {
    let testLlmProvider: TestLlmProvider;
    let action: CreateProfessionalDevelopmentAction;

    const validProfDev: ProfessionalDevelopmentLlmResponse = {
        key_terms: ['Strategic Thinker', 'Innovative', 'Analytical', 'Decisive', 'Visionary'],
        description: 'Strong focus on systematic problem-solving and strategic planning. You excel at identifying opportunities for optimization and growth.',
        leadership_style_title: 'Transformational',
        leadership_style_description: 'You inspire and motivate others through vision and intellectual stimulation.',
        goal_setting_style_title: 'Mastery-oriented',
        goal_setting_style_description: 'You focus on continuous improvement and developing expertise in your chosen domains.'
    };

    beforeEach(async () => {
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        action = new CreateProfessionalDevelopmentAction(testLlmProvider);
    });

    afterEach(async () => {
        await testLlmProvider.end();
        testLlmProvider.clearMockResponses();
    });

    it('should generate professional development successfully with structured output', async () => {
        const testContext = 'User is a strategic thinker with strong analytical skills.';
        testLlmProvider.setNextResponse(
            JSON.stringify({ entries: validProfDev })
        );

        const result = await action.execute(testContext);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.key_terms).toHaveLength(5);
            expect(result.value.leadership_style_title).toBe('Transformational');
            expect(result.value.goal_setting_style_title).toBe('Mastery-oriented');
            expect(result.value).toEqual(validProfDev);
        }
    });

    it('should handle invalid professional development structure', async () => {
        const testContext = 'User is a strategic thinker.';
        const invalidProfDev = cloneDeep(validProfDev);
        delete (invalidProfDev as any).leadership_style_description;
        
        testLlmProvider.setNextResponse(
            JSON.stringify({ entries: invalidProfDev })
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should handle empty required fields', async () => {
        const testContext = 'User is a strategic thinker.';
        const invalidProfDev = cloneDeep(validProfDev);
        invalidProfDev.description = '';
        
        testLlmProvider.setNextResponse(
            JSON.stringify({ entries: invalidProfDev })
        );
        
        const result = await action.execute(testContext);
        expect(result.isErr()).toBe(true);
    });

    it('should attempt to retry with malformed response', async () => {
        const testContext = 'User is a strategic thinker.';
        const malformedResponse = `The user's leadership style is Transformational, focusing on inspiring others. They set goals systematically with clear timelines.`;

        testLlmProvider.clearMockResponses();
        testLlmProvider.setSupportsStructuredOutputs(false);
        testLlmProvider.setSupportsJsonResultOutput(false);

        testLlmProvider.setNextResponse(
            malformedResponse
        );
        testLlmProvider.setMockResponse(
            retryProfessionalDevelopmentPrompt().content,
            JSON.stringify({ entries: validProfDev })
        );
        
        const result = await action.execute(testContext);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual(validProfDev);
        }

        // Reset provider capabilities
        testLlmProvider.setSupportsStructuredOutputs(true);
        testLlmProvider.setSupportsJsonResultOutput(true);
    });

    it('should handle invalid key_terms array length', async () => {
        const testContext = 'User is a strategic thinker.';
        const invalidProfDev = cloneDeep(validProfDev);
        invalidProfDev.key_terms = invalidProfDev.key_terms.slice(0, 3); // Only 3 terms instead of required 5
        
        testLlmProvider.setNextResponse(
            JSON.stringify({ entries: invalidProfDev })
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
            action = new CreateProfessionalDevelopmentAction(openAiLlmProvider);

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
                expect(result.value.key_terms).toHaveLength(5);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if the generated professional development profile meets the requirements and aligns with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Must have exactly 5 key terms that are meaningful and distinct
2. Description should be concise (max 2 sentences) and forward-looking
3. Leadership style must be one of: Democratic/Participative, Autocratic/Authoritarian, Laissez-faire/Delegative, Transformational, Transactional
4. Goal-setting style must be one of: Performance-oriented, Learning-oriented, Avoidance-oriented, Mastery-oriented
5. All descriptions should be meaningful and align with the personality context`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Profile:
${JSON.stringify(result.value, null, 2)}

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

        test('should successfully parse valid LLM response Mistral integration test', async () => {
            const mistralAction = new CreateProfessionalDevelopmentAction(mistralLlmProvider);

            const testContext = `MBTI Results Summary: INTJ ("The Mastermind")

Personality Type: INTJ - Introverted, Intuitive, Thinking, Judging

Overview:
As an INTJ, you are a strategic thinker who values efficiency, independence, and logical problem-solving. You have a visionary mindset, always seeking to improve systems, optimize processes, and anticipate long-term outcomes. You are highly self-sufficient and prefer working with concepts, patterns, and structured plans rather than day-to-day details.`;

            const result = await mistralAction.execute(testContext);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.key_terms).toHaveLength(5);

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if the generated professional development profile meets the requirements and aligns with the given context. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Must have exactly 5 key terms that are meaningful and distinct
2. Description should be concise (max 2 sentences) and forward-looking
3. Leadership style must be one of: Democratic/Participative, Autocratic/Authoritarian, Laissez-faire/Delegative, Transformational, Transactional
4. Goal-setting style must be one of: Performance-oriented, Learning-oriented, Avoidance-oriented, Mastery-oriented
5. All descriptions should be meaningful and align with the personality context`
                    },
                    {
                        role: 'user',
                        content: `Personality Context:
${testContext}

Generated Profile:
${JSON.stringify(result.value, null, 2)}

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