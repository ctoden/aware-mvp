import {CreateUserQuickInsightAction} from '../CreateUserQuickInsightAction';
import {TestLlmProvider} from '@src/providers/llm/__tests__/TestLlmProvider';
import {UserAssessment} from '@src/models/UserAssessment';
import {get} from "lodash";
import {OpenAiLlmProvider} from "@src/providers/llm/OpenAiLlmProvider";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LlmMessage} from '@src/providers/llm/LlmProvider';
import {MistralLlmProvider} from "@src/providers/llm/MistralLlmProvider";
import {TestAuthProvider} from '@src/providers/auth/__tests__/TestAuthProvider';
import {AUTH_PROVIDER_KEY} from '@src/providers/auth/AuthProvider';
import {AuthService} from '@src/services/AuthService';
import {user$} from '@src/models/SessionModel';
import {userProfile$} from '@src/models/UserProfile';
import {UserModel} from '@src/models/UserModel';

const runIntegrationTests = true;

const getOpenAiApiKey = () => {
    return process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_OPENAI_API_KEY') as unknown as string;
};

const getMistralApiKey = () => {
    return process.env.EXPO_PUBLIC_MISTRAL_API_KEY ?? get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY') as unknown as string;
};

describe('CreateUserQuickInsightAction', () => {
    let action: CreateUserQuickInsightAction;
    let testLlmProvider: TestLlmProvider;
    let testAuthProvider: TestAuthProvider;
    let authService: AuthService;

    const mockUser: UserModel = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    const mockProfile = {
        id: 'test-user-id',
        full_name: 'Test User',
        avatar_url: null,
        website: null,
        summary: null,
        phone_number: null,
        birth_date: new Date('1990-01-01'),
        updated_at: null,
        family_story: null,
        primary_occupation: null
    };

    const validInsight = {
        entries: {
            title: 'Growth Mindset',
            description: 'Your ENTJ traits show you thrive on challenges 🚀'
        }
    };

    const testAssessment: UserAssessment = {
        id: '1',
        user_id: 'test-user-id',
        assessment_type: 'MBTI',
        name: 'Myers Briggs (MBTI) Assessment',
        assessment_full_text: '',
        assessment_summary: 'ENTJ',
        created_at: new Date().toISOString(),
        updated_at: new Date(Date.now() + 60000).toISOString()
    };

    beforeEach(async () => {
        // Set up auth provider
        testAuthProvider = new TestAuthProvider();
        await testAuthProvider.initialize();
        DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);

        // Set up auth service
        authService = new AuthService();
        await authService.initialize();

        // Set up LLM provider
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        action = new CreateUserQuickInsightAction(testLlmProvider);

        // Set up mock user session
        testAuthProvider.setSession({
            access_token: 'test_token',
            user: mockUser
        });
        user$.set(mockUser);
        userProfile$.set(mockProfile);
    });

    afterEach(async () => {
        await testLlmProvider.end();
        await authService.end();
        await testAuthProvider.end();
        testLlmProvider.clearMockResponses();
        user$.set(null);
        userProfile$.set(null);
        DependencyService.unregister(AUTH_PROVIDER_KEY);
    });

    it('should successfully parse valid LLM response', async () => {
        testLlmProvider.setNextResponse(
            JSON.stringify(validInsight)
        );
        
        const result = await action.execute([testAssessment]);
        
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const [title, description] = result.value.split('|');
            expect(title).toBe(validInsight.entries.title);
            expect(description).toBe(validInsight.entries.description);
        }
    });

    it('should handle invalid insight structure', async () => {
        const invalidInsight = {
            entries: {
                title: 'Growth Mindset',
                // missing description
            }
        };
        
        testLlmProvider.setNextResponse(
            JSON.stringify(invalidInsight)
        );
        
        const result = await action.execute([testAssessment]);
        expect(result.isErr()).toBe(true);
    });

    it('should handle title with too many characters', async () => {
        const invalidInsight = {
            entries: {
                title: 'This Title Is Way Too Long And Should Fail Validation',
                description: 'Valid description with emoji 🚀'
            }
        };
        
        testLlmProvider.setNextResponse(
            JSON.stringify(invalidInsight)
        );
        
        const result = await action.execute([testAssessment]);
        expect(result.isErr()).toBe(true);
    });

    it('should handle missing emoji in description', async () => {
        const invalidInsight = {
            entries: {
                title: 'Valid Title',
                description: 'This description has no emoji and should fail validation'
            }
        };
        
        testLlmProvider.setNextResponse(
            JSON.stringify(invalidInsight)
        );
        
        const result = await action.execute([testAssessment]);
        expect(result.isErr()).toBe(true);
    });

    it('should handle malformed response', async () => {
        const malformedResponse = 'This is not valid JSON';

        testLlmProvider.clearMockResponses();
        testLlmProvider.setSupportsStructuredOutputs(false);
        testLlmProvider.setSupportsJsonResultOutput(false);

        testLlmProvider.setNextResponse(
            malformedResponse
        );

        testLlmProvider.setNthResponse(1, JSON.stringify(validInsight));
        
        const result = await action.execute([testAssessment]);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const [title, description] = result.value.split('|');
            expect(title).toBe(validInsight.entries.title);
            expect(description).toBe(validInsight.entries.description);
        }

        // Reset provider capabilities
        testLlmProvider.setSupportsStructuredOutputs(true);
        testLlmProvider.setSupportsJsonResultOutput(true);
    });

    it('should handle empty assessment list', async () => {
        const result = await action.execute([]);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(true);
        }
    });

    it('should combine multiple assessments into context', async () => {
        const secondAssessment = {
            ...testAssessment,
            id: '2',
            assessment_type: 'Big5',
            assessment_summary: 'High openness, conscientiousness'
        };

        const expectedContext = `${testAssessment.assessment_type}: ${testAssessment.assessment_summary}\n${secondAssessment.assessment_type}: ${secondAssessment.assessment_summary}`;

        testLlmProvider.setNextResponse(
            JSON.stringify(validInsight)
        );

        const result = await action.execute([testAssessment, secondAssessment]);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const [title, description] = result.value.split('|');
            expect(title).toBe(validInsight.entries.title);
            expect(description).toBe(validInsight.entries.description);
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
            action = new CreateUserQuickInsightAction(openAiLlmProvider);

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
            const testContext = [
                {
                    ...testAssessment,
                    assessment_type: 'MBTI',
                    assessment_summary: 'INTJ ("The Mastermind") - Introverted, Intuitive, Thinking, Judging. You are a strategic thinker who values efficiency and independence.'
                },
                {
                    ...testAssessment,
                    id: '2',
                    assessment_type: 'Big5',
                    assessment_summary: 'High in conscientiousness and openness, moderate in extraversion and agreeableness.'
                }
            ];

            const result = await action.execute(testContext);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const [title, description] = result.value.split('|');

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if the generated quick insight meets the requirements. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Title should be max 25 characters
2. Description should be a single sentence
3. Description must include an emoji
4. Insight should be meaningful and offer constructive "tough love" advice
5. Content should align with the personality context
6. Tone should be playful but professional`
                    },
                    {
                        role: 'user',
                        content: `Assessment Context:
${testContext.map(a => `${a.assessment_type}: ${a.assessment_summary}`).join('\n')}

Generated Quick Insight:
Title: ${title}
Description: ${description}

Is this insight valid according to the criteria?`
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
            const mistralAction = new CreateUserQuickInsightAction(mistralLlmProvider);

            const testContext = [
                {
                    ...testAssessment,
                    assessment_type: 'MBTI',
                    assessment_summary: 'INTJ ("The Mastermind") - Introverted, Intuitive, Thinking, Judging. You are a strategic thinker who values efficiency and independence.'
                },
                {
                    ...testAssessment,
                    id: '2',
                    assessment_type: 'Big5',
                    assessment_summary: 'High in conscientiousness and openness, moderate in extraversion and agreeableness.'
                }
            ];

            const result = await mistralAction.execute(testContext);

            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                const [title, description] = result.value.split('|');

                const comparisonPrompt: LlmMessage[] = [
                    {
                        role: 'system',
                        content: `You are a validator checking if the generated quick insight meets the requirements. 
Respond only with "valid" or "invalid". Consider the following criteria:
1. Title should be max 25 characters
2. Description should be a single sentence
3. Description must include an emoji
4. Insight should be meaningful and offer constructive "tough love" advice
5. Content should align with the personality context
6. Tone should be playful but professional`
                    },
                    {
                        role: 'user',
                        content: `Assessment Context:
${testContext.map(a => `${a.assessment_type}: ${a.assessment_summary}`).join('\n')}

Generated Quick Insight:
Title: ${title}
Description: ${description}

Is this insight valid according to the criteria?`
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