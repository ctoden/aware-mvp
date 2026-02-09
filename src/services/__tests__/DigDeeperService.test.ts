import {DigDeeperService} from "../DigDeeperService";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";
import {DATA_PROVIDER_KEY} from "@src/providers/data/DataProvider";
import {
    DigDeeperQuestion,
    digDeeperQuestions$,
    DigDeeperQuestionStatus,
    DigDeeperQuestionType,
    getDigDeeperQuestionsArray
} from "@src/models/DigDeeperQuestion";
import {user$} from "@src/models/SessionModel";
import {generateDigDeeperPrompt, PromptContext, formatUserContext, formatPreviousQuestions} from "@src/prompts/digDeeperPromptTemplate";
import {container} from "tsyringe";
import {wait} from "@src/utils/PromiseUtils";
import { userProfile$ } from "@src/models/UserProfile";

function getTextPromptContext(name: string = 'Unknown', personalityData: string[] = ["test-context"], previousQuestions: DigDeeperQuestion[] = []): PromptContext {
    return {
        userContext: {
            name,
            personalityData
        },
        previousQuestions: previousQuestions.map(q => ({
            question: q.question,
            status: q.status === DigDeeperQuestionStatus.ANSWERED ? 'ANSWERED' as const : 'SKIPPED' as const
        }))
    }
}

describe('DigDeeperService', () => {
    let service: DigDeeperService;
    let testLlmProvider: TestLlmProvider;
    let testDataProvider: TestDataProvider;

    const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        phone_confirmed_at: undefined,
        last_sign_in_at: new Date().toISOString(),
        confirmed_at: new Date().toISOString()
    };

    const mockUserProfile = {
        id: 'test-user-profile-id',
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        website: 'https://example.com',
        summary: 'This is a test user profile. As an INTP, I am a curious and analytical person who enjoys exploring new ideas and solving complex problems.',
        phone_number: '123-456-7890',
        birth_date: new Date('1990-01-01'),
        updated_at: new Date().toISOString(),
        family_story: 'This is a test family story',
        primary_occupation: 'Software Engineer'
    };
    
    const mockQuestions: DigDeeperQuestion[] = [
        {
            id: '1',
            user_id: mockUser.id,
            question: 'What are your career goals?',
            question_type: DigDeeperQuestionType.ONBOARDING_DATA,
            context: 'Understanding career aspirations',
            status: DigDeeperQuestionStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '2',
            user_id: mockUser.id,
            question: 'What motivates you?',
            question_type: DigDeeperQuestionType.PERSONALITY_INSIGHTS,
            context: 'Understanding personal motivations',
            status: DigDeeperQuestionStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: '3',
            user_id: mockUser.id,
            question: 'What are your hobbies?',
            question_type: DigDeeperQuestionType.PERSONALITY_INSIGHTS,
            context: 'Understanding personal interests',
            status: DigDeeperQuestionStatus.PENDING,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    beforeEach(async () => {
        // Reset observables
        user$.set(null);
        userProfile$.set(null);
        digDeeperQuestions$.set(null);

        // Setup providers and register them
        testLlmProvider = new TestLlmProvider();
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();

        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);

        // Setup test data
        testDataProvider.setTestData('dig_deeper_questions', mockQuestions);

        // Set up test user
        user$.set(mockUser);
        userProfile$.set(mockUserProfile);

        // Create and initialize service
        service = new DigDeeperService();
        await service.initialize();

        // Register the service instance with the container
        container.registerInstance(DigDeeperService, service);
    });

    afterEach(async () => {
        // Clean up services
        await service.end();
        await testDataProvider.end();

        // Clear observables
        user$.set(null);
        digDeeperQuestions$.set(null);

        // Unregister dependencies
        DependencyService.unregister(LLM_PROVIDER_KEY);
        DependencyService.unregister(DATA_PROVIDER_KEY);

        // Clear the container registration
        container.clearInstances();
    });

    describe('fetchUserQuestions', () => {
        it('should fetch user questions successfully', async () => {
            const result = await service.fetchUserQuestions(mockUser.id);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(mockQuestions.length);
                expect(result.value[0].id).toBe(mockQuestions[0].id);
            }
        });

        it('should handle data provider errors', async () => {
            testDataProvider.clearTestData();
            const result = await service.fetchUserQuestions('non-existent-user');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(0);
            }
        });
    });

    describe('generateNewQuestions', () => {
        it('should generate new questions successfully', async () => {
            const mockResponse = {
                entries: mockQuestions.map(({ question, question_type, context }) => ({
                    question,
                    question_type,
                    context,
                    status: DigDeeperQuestionStatus.PENDING
                }))
            };

            const previousQuestions = getDigDeeperQuestionsArray()
                .filter((q) => (q.status === DigDeeperQuestionStatus.ANSWERED || q.status === DigDeeperQuestionStatus.SKIPPED))
                .map(q => ({
                    question: q.question,
                    status: q.status === DigDeeperQuestionStatus.ANSWERED ? 'ANSWERED' as const : 'SKIPPED' as const
                }));

            const uContext = {
                userContext: {
                    name: 'Unknown',
                    personalityData: ["test-context"]
                },
                previousQuestions: previousQuestions
            };

            // Set mock response for any input
            testLlmProvider.setNextResponse(JSON.stringify(mockResponse));

            const result = await service.generateNewQuestions(uContext);
            expect(result.isOk()).toBe(true);
            await wait(500);
            if (result.isOk()) {
                const digDeeperQuestions = getDigDeeperQuestionsArray();
                expect(digDeeperQuestions).toHaveLength(mockQuestions.length);
                expect(digDeeperQuestions[0].question).toBe(mockQuestions[0].question);
            }
        });

        it('should handle LLM provider errors', async () => {
            testLlmProvider.setMockResponse('*', 'error');
            const result = await service.generateNewQuestions(getTextPromptContext());
            expect(result.isErr()).toBe(true);
        });

        it('should handle no user logged in', async () => {
            user$.set(null);
            const result = await service.generateNewQuestions(getTextPromptContext());
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No user logged in');
            }
        });
    });

    describe('answerQuestion', () => {
        beforeEach(() => {
            // Set up initial questions in observable
            const questionsMap = mockQuestions.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
            }, {} as Record<string, DigDeeperQuestion>);
            digDeeperQuestions$.set(questionsMap);
        });

        it('should answer question successfully', async () => {
            const result = await service.answerQuestion(mockQuestions[0].id, 'Test answer');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.status).toBe(DigDeeperQuestionStatus.ANSWERED);
                expect(result.value.answer).toBe('Test answer');
            }
        });

        it('should handle non-existent question', async () => {
            const result = await service.answerQuestion('non-existent-id', 'Test answer');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Question not found');
            }
        });

        it('should handle no user logged in', async () => {
            user$.set(null);
            const result = await service.answerQuestion(mockQuestions[0].id, 'Test answer');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No user logged in');
            }
        });
    });

    describe('skipQuestion', () => {
        beforeEach(() => {
            // Set up initial questions in observable
            const questionsMap = mockQuestions.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
            }, {} as Record<string, DigDeeperQuestion>);
            digDeeperQuestions$.set(questionsMap);
        });

        it('should skip question successfully', async () => {
            const result = await service.skipQuestion(mockQuestions[0].id);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.status).toBe(DigDeeperQuestionStatus.SKIPPED);
            }
        });

        it('should handle non-existent question', async () => {
            const result = await service.skipQuestion('non-existent-id');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Question not found');
            }
        });

        it('should handle no user logged in', async () => {
            user$.set(null);
            const result = await service.skipQuestion(mockQuestions[0].id);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No user logged in');
            }
        });
    });

    describe('clearQuestions', () => {
        it('should clear questions successfully', async () => {
            const result = await service.clearQuestions();
            expect(result.isOk()).toBe(true);
            expect(digDeeperQuestions$.get()).toBeNull();
        });

        it('should handle no user logged in', async () => {
            user$.set(null);
            const result = await service.clearQuestions();
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No user logged in');
            }
        });
    });

    describe('hasUnansweredQuestions', () => {
        it('should return true when there are pending questions', () => {
            const questionsMap = mockQuestions.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
            }, {} as Record<string, DigDeeperQuestion>);
            digDeeperQuestions$.set(questionsMap);

            expect(service.hasUnansweredQuestions()).toBe(true);
        });

        it('should return false when all questions are answered or skipped', () => {
            const answeredQuestions = mockQuestions.map(q => ({
                ...q,
                status: DigDeeperQuestionStatus.ANSWERED
            }));
            const questionsMap = answeredQuestions.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
            }, {} as Record<string, DigDeeperQuestion>);
            digDeeperQuestions$.set(questionsMap);

            expect(service.hasUnansweredQuestions()).toBe(false);
        });

        it('should return false when there are no questions', () => {
            digDeeperQuestions$.set(null);
            expect(service.hasUnansweredQuestions()).toBe(false);
        });
    });

    describe('ensureMinimumPendingQuestions', () => {
        it('should do nothing when there are already enough pending questions', async () => {
            // Setup initial state with 3 pending questions
            const questionsMap = mockQuestions.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
            }, {} as Record<string, DigDeeperQuestion>);
            digDeeperQuestions$.set(questionsMap);

            const result = await service.ensureMinimumPendingQuestions();
            expect(result.isOk()).toBe(true);
            
            // Verify no new questions were generated
            const pendingQuestions = getDigDeeperQuestionsArray()
                .filter(q => q.status === DigDeeperQuestionStatus.PENDING);
            expect(pendingQuestions.length).toBe(3);
        });

        it('should generate new questions when there are not enough pending questions', async () => {
            // Setup initial state with 1 pending question and 2 answered
            const initialQuestions = [
                { ...mockQuestions[0] }, // Pending
                { ...mockQuestions[1], status: DigDeeperQuestionStatus.ANSWERED },
                { ...mockQuestions[2], status: DigDeeperQuestionStatus.ANSWERED }
            ];
            const questionsMap = initialQuestions.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
            }, {} as Record<string, DigDeeperQuestion>);
            digDeeperQuestions$.set(questionsMap);

            // Setup mock LLM response for new questions
            const mockResponse = {
                entries: mockQuestions.map(({ question, question_type, context }) => ({
                    question,
                    question_type,
                    context,
                    status: DigDeeperQuestionStatus.PENDING
                }))
            };

            const contextResult = service.createPromptContextFromUserData();
            if(!contextResult.isOk()) {
                throw new Error('Failed to create context' + contextResult.error.message);
            }

            testLlmProvider.setNextResponse(JSON.stringify(mockResponse));

            const result = await service.ensureMinimumPendingQuestions();
            expect(result.isOk()).toBe(true);

            // Verify we now have at least 3 pending questions
            const pendingQuestions = getDigDeeperQuestionsArray()
                .filter(q => q.status === DigDeeperQuestionStatus.PENDING);
            expect(pendingQuestions.length).toBeGreaterThanOrEqual(3);
        });

        it('should handle no user logged in', async () => {
            user$.set(null);
            const result = await service.ensureMinimumPendingQuestions();
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No user logged in');
            }
        });

        it('should handle LLM provider errors', async () => {
            // Setup initial state with 1 pending question
            const initialQuestions = [
                { ...mockQuestions[0] }, // Pending
                { ...mockQuestions[1], status: DigDeeperQuestionStatus.ANSWERED },
                { ...mockQuestions[2], status: DigDeeperQuestionStatus.ANSWERED }
            ];
            const questionsMap = initialQuestions.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
            }, {} as Record<string, DigDeeperQuestion>);
            digDeeperQuestions$.set(questionsMap);

            const prompt = generateDigDeeperPrompt(getTextPromptContext());

            testLlmProvider.setMockResponse(prompt.content, 'error');
            const result = await service.ensureMinimumPendingQuestions();
            expect(result.isErr()).toBe(true);
        });
    });
}); 