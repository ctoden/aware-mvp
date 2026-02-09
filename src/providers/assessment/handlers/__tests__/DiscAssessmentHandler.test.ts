import { DiscAssessmentHandler } from '../DiscAssessmentHandler';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LlmService } from '@src/services/LlmService';
import { ILlmProvider, LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { userProfile$ } from '@src/models/UserProfile';
import { MistralLlmProvider } from "@src/providers/llm/MistralLlmProvider";
import { get } from 'lodash';

describe('DiscAssessmentHandler', () => {
    let discHandler: DiscAssessmentHandler;
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

        // Create the DISC handler
        discHandler = new DiscAssessmentHandler(testUserId);
    });

    afterEach(async () => {
        await llmService.end();
        await testLlmProvider.end();
        userProfile$.summary.set('');
    });

    describe('generateSummary', () => {
        it('should generate summary from DISC scores', async () => {
            // Arrange
            const scores = {
                dominance: 80,
                influence: 75,
                steadiness: 60,
                conscientiousness: 85
            };

            // Act
            const result = await discHandler.generateSummary({ scores, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('Dominance: 80');
                expect(result.value).toContain('Influence: 75');
                expect(result.value).toContain('Steadiness: 60');
                expect(result.value).toContain('Conscientiousness: 85');
            }
        });

        it('should handle missing scores', async () => {
            // Arrange
            const scores = {
                dominance: 80,
                influence: 75,
                // missing steadiness
                conscientiousness: 85
            };

            // Act
            const result = await discHandler.generateSummary({ scores, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('Dominance: 80');
                expect(result.value).toContain('Influence: 75');
                expect(result.value).toContain('Conscientiousness: 85');
            }
        });
    });

    describe('generateDetailedSummary', () => {
        it('should generate detailed summary with assessment result', async () => {
            // Arrange
            const scores = {
                dominance: 80,
                influence: 75,
                steadiness: 60,
                conscientiousness: 85
            };
            const assessmentResult = "This is a full detailed response";

            // Act
            const result = await discHandler.generateDetailedSummary({ scores, assessmentResult });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('should handle empty assessment result', async () => {
            // Arrange
            const scores = {
                dominance: 80,
                influence: 75,
                steadiness: 60,
                conscientiousness: 85
            };

            // Act
            const result = await discHandler.generateDetailedSummary({ scores, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
            }
        });
    });
}); 