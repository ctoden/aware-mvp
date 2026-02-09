import { CliftonStrengthsAssessmentHandler } from '../CliftonStrengthsAssessmentHandler';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LlmService } from '@src/services/LlmService';
import { ILlmProvider, LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { userProfile$ } from '@src/models/UserProfile';
import { MistralLlmProvider } from "@src/providers/llm/MistralLlmProvider";
import { get } from 'lodash';

describe('CliftonStrengthsAssessmentHandler', () => {
    let cliftonStrengthsHandler: CliftonStrengthsAssessmentHandler;
    let testLlmProvider: ILlmProvider;
    let llmService: LlmService;

    const testUserId = 'test-user-id';

    beforeEach(async () => {
        // Set up API key from test env since Jest messes up process.env
        const apiKeyFromTestEnv = get(global, "test.env.EXPO_PUBLIC_MISTRAL_API_KEY") as unknown as string;
        DependencyService.registerValue("MISTRAL_API_KEY", apiKeyFromTestEnv);
        DependencyService.registerValue("MISTRAL_DEFAULT_MODEL", "open-mistral-nemo");

        testLlmProvider = new MistralLlmProvider();
        await testLlmProvider.initialize();
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Initialize the LLM service
        llmService = new LlmService();
        await llmService.initialize();

        // Create the CliftonStrengths handler
        cliftonStrengthsHandler = new CliftonStrengthsAssessmentHandler(testUserId);
    });

    afterEach(async () => {
        await llmService.end();
        await testLlmProvider.end();
        userProfile$.summary.set('');
    });

    describe('generateSummary', () => {
        it('should generate summary from CliftonStrengths', async () => {
            // Arrange
            const strengths = [
                'Strategic',
                'Ideation',
                'Learner',
                'Achiever',
                'Intellection'
            ];

            // Act
            const result = await cliftonStrengthsHandler.generateSummary({ strengths, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('Strategic');
                expect(result.value).toContain('Ideation');
                expect(result.value).toContain('Learner');
                expect(result.value).toContain('Achiever');
                expect(result.value).toContain('Intellection');
            }
        });

        it('should handle empty strengths array', async () => {
            // Arrange
            const strengths: string[] = [];

            // Act
            const result = await cliftonStrengthsHandler.generateSummary({ strengths, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe('');
            }
        });
    });

    describe('generateDetailedSummary', () => {
        it('should generate detailed summary with assessment result', async () => {
            // Arrange
            const strengths = [
                'Strategic',
                'Ideation',
                'Learner',
                'Achiever',
                'Intellection'
            ];
            const assessmentResult = "This is a full detailed response";

            // Act
            const result = await cliftonStrengthsHandler.generateDetailedSummary({ strengths, assessmentResult });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.length).toBeGreaterThanOrEqual(1)
            }
        });

        it('should handle empty assessment result', async () => {
            // Arrange
            const strengths = [
                'Strategic',
                'Ideation',
                'Learner',
                'Achiever',
                'Intellection'
            ];

            // Act
            const result = await cliftonStrengthsHandler.generateDetailedSummary({ strengths, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
            }
        });
    });
}); 