import { DigDeeperViewModel } from "../DigDeeperViewModel";
import { DigDeeperService } from "@src/services/DigDeeperService";
import { TestLlmProvider } from "@src/providers/llm/__tests__/TestLlmProvider";
import { DependencyService } from "@src/core/injection/DependencyService";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { TestDataProvider } from "@src/providers/data/__tests__/TestDataProvider";
import {
    DigDeeperQuestion,
    DigDeeperQuestionStatus,
    DigDeeperQuestionType,
    digDeeperQuestions$,
    getDigDeeperQuestionsArray
} from "@src/models/DigDeeperQuestion";
import { user$ } from "@src/models/SessionModel";
import { err } from "neverthrow";
import { withViewModel } from "../ViewModel";
import { container } from "tsyringe";
import { nanoid } from "nanoid";
import { digDeeperPromptTemplate } from "@src/prompts/digDeeperPromptTemplate";

describe('DigDeeperViewModel', () => {
    let viewModel: DigDeeperViewModel;
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

        // Create and initialize view model
        viewModel = await withViewModel(DigDeeperViewModel, nanoid(5));

        // Register the viewModel instance with the container
        container.registerInstance(DigDeeperViewModel, viewModel);
    });

    afterEach(async () => {
        // Clean up services
        await viewModel.end();
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

    describe('generateQuestions', () => {
        it('should generate new questions successfully', async () => {
            // Set up mock LLM response
            const mockResponse = {
                questions: mockQuestions.map(({ question, question_type, context }) => ({
                    question,
                    question_type,
                    context,
                    status: DigDeeperQuestionStatus.PENDING
                }))
            };

            const previousQuestions = getDigDeeperQuestionsArray()
                .map(q => q.question);

            const prompt = digDeeperPromptTemplate
                .replace('{{userContext}}', 'test-context')
                .replace('{{previousQuestions}}', previousQuestions.join('\n'));

            testLlmProvider.setMockResponse(prompt, JSON.stringify(mockResponse));

            // Generate questions
            const result = await viewModel.generateQuestions('test-context');
            expect(result.isOk()).toBe(true);

            // Verify state
            const state = viewModel.state$.get();
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeNull();
        });

        it('should handle errors when generating questions', async () => {
            testLlmProvider.setMockResponse('test-context', 'error');

            const result = await viewModel.generateQuestions('test-context');
            expect(result.isErr()).toBe(true);

            const state = viewModel.state$.get();
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeTruthy();
        });
    });

    describe('answerQuestion', () => {
        beforeEach(() => {
            // Set up initial questions
            const questionsMap = mockQuestions.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
            }, {} as Record<string, DigDeeperQuestion>);
            digDeeperQuestions$.set(questionsMap);
        });

        it('should answer question successfully', async () => {
            const questionToAnswer = mockQuestions[0];
            const result = await viewModel.answerQuestion(questionToAnswer, 'Test answer');
            expect(result.isOk()).toBe(true);

            // Verify question was answered
            const questions = digDeeperQuestions$.peek();
            const answeredQuestion = questions?.[questionToAnswer.id];
            expect(answeredQuestion?.status).toBe(DigDeeperQuestionStatus.ANSWERED);
            expect(answeredQuestion?.answer).toBe('Test answer');
        });

        it('should handle errors when answering questions', async () => {
            // Force service to return error
            jest.spyOn(DigDeeperService.prototype, 'answerQuestion')
                .mockImplementation(() => Promise.resolve(err(new Error('Test error'))));

            const questionToAnswer = mockQuestions[0];
            const result = await viewModel.answerQuestion(questionToAnswer, 'Test answer');
            expect(result.isErr()).toBe(true);

            const state = viewModel.state$.get();
            expect(state.isLoading).toBe(false);
            expect(state.error).toBeTruthy();
        });

        it('should handle null question', async () => {
            const result = await viewModel.answerQuestion(null as any, 'Test answer');
            expect(result.isErr()).toBe(true);
            expect(result._unsafeUnwrapErr().message).toBe('Question is required');
        });
    });

    describe('skipQuestion', () => {
        beforeEach(() => {
            // Set up initial questions
            const questionsMap = mockQuestions.reduce((acc, q) => {
                acc[q.id] = q;
                return acc;
            }, {} as Record<string, DigDeeperQuestion>);
            digDeeperQuestions$.set(questionsMap);
        });

        it('should skip question successfully', async () => {
            const questionToSkip = mockQuestions[0];
            const result = await viewModel.skipQuestion(questionToSkip);
            expect(result.isOk()).toBe(true);

            // Verify question was skipped
            const questions = digDeeperQuestions$.peek();
            const skippedQuestion = questions?.[questionToSkip.id];
            expect(skippedQuestion?.status).toBe(DigDeeperQuestionStatus.SKIPPED);
        });

        it('should handle null question', async () => {
            const result = await viewModel.skipQuestion(null as any);
            expect(result.isErr()).toBe(true);
            expect(result._unsafeUnwrapErr().message).toBe('Question is required');
        });
    });
}); 