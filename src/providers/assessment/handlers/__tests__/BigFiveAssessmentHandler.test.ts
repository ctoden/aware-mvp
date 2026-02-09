import { BigFiveAssessmentHandler } from '../BigFiveAssessmentHandler';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LlmService } from '@src/services/LlmService';
import { ILlmProvider, LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { userProfile$ } from '@src/models/UserProfile';
import { MistralLlmProvider } from "@src/providers/llm/MistralLlmProvider";
import { get } from 'lodash';

describe('BigFiveAssessmentHandler', () => {
    let bigFiveHandler: BigFiveAssessmentHandler;
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

        // Create the BigFive handler
        bigFiveHandler = new BigFiveAssessmentHandler(testUserId);
    });

    afterEach(async () => {
        await llmService.end();
        await testLlmProvider.end();
        userProfile$.summary.set('');
    });

    describe('generateSummary', () => {
        it('should generate summary from Big Five scores', async () => {
            // Arrange
            const scores = {
                openness: 80,
                conscientiousness: 75,
                extraversion: 60,
                agreeableness: 85,
                neuroticism: 40
            };

            // Act
            const result = await bigFiveHandler.generateSummary({ scores, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('Openness: 80');
                expect(result.value).toContain('Conscientiousness: 75');
                expect(result.value).toContain('Extraversion: 60');
                expect(result.value).toContain('Agreeableness: 85');
                expect(result.value).toContain('Neuroticism: 40');
            }
        });

        it('should handle missing scores', async () => {
            // Arrange
            const scores = {
                openness: 80,
                conscientiousness: 75,
                // missing extraversion
                agreeableness: 85,
                neuroticism: 40
            };

            // Act
            const result = await bigFiveHandler.generateSummary({ scores, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('Openness: 80');
                expect(result.value).toContain('Conscientiousness: 75');
                expect(result.value).toContain('Agreeableness: 85');
                expect(result.value).toContain('Neuroticism: 40');
            }
        });
    });

    describe('generateDetailedSummary', () => {
        it('should generate detailed summary with assessment result', async () => {
            // Arrange
            const scores = {
                openness: 80,
                conscientiousness: 75,
                extraversion: 60,
                agreeableness: 85,
                neuroticism: 40
            };
            const assessmentResult = "This is a full detailed response";

            // Act
            const result = await bigFiveHandler.generateDetailedSummary({ scores, assessmentResult });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('should handle empty assessment result', async () => {
            // Arrange
            const scores = {
                openness: 80,
                conscientiousness: 75,
                extraversion: 60,
                agreeableness: 85,
                neuroticism: 40
            };

            // Act
            const result = await bigFiveHandler.generateDetailedSummary({ scores, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
        });
    });
}); 