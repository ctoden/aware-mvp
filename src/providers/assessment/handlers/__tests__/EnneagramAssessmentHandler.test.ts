import { EnneagramAssessmentHandler } from '../EnneagramAssessmentHandler';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LlmService } from '@src/services/LlmService';
import { ILlmProvider, LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { userProfile$ } from '@src/models/UserProfile';
import { MistralLlmProvider } from "@src/providers/llm/MistralLlmProvider";
import { get } from 'lodash';

describe('EnneagramAssessmentHandler', () => {
    let enneagramHandler: EnneagramAssessmentHandler;
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

        // Create the Enneagram handler
        enneagramHandler = new EnneagramAssessmentHandler(testUserId);
    });

    afterEach(async () => {
        await llmService.end();
        await testLlmProvider.end();
        userProfile$.summary.set('');
    });

    describe('generateSummary', () => {
        it('should generate summary from Enneagram scores', async () => {
            // Arrange
            const scores = {
                type1: 80,
                type2: 75,
                type3: 60,
                type4: 85,
                type5: 70,
                type6: 65,
                type7: 55,
                type8: 90,
                type9: 50
            };

            // Act
            const result = await enneagramHandler.generateSummary({ scores, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('The Reformer: 80');
                expect(result.value).toContain('The Helper: 75');
                expect(result.value).toContain('The Achiever: 60');
                expect(result.value).toContain('The Individualist: 85');
                expect(result.value).toContain('The Investigator: 70');
                expect(result.value).toContain('The Loyalist: 65');
                expect(result.value).toContain('The Enthusiast: 55');
                expect(result.value).toContain('The Challenger: 90');
                expect(result.value).toContain('The Peacemaker: 50');
            }
        });

        it('should handle missing scores', async () => {
            // Arrange
            const scores = {
                type1: 80,
                type2: 75,
                // missing type3
                type4: 85,
                type5: 70
            };

            // Act
            const result = await enneagramHandler.generateSummary({ scores, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('The Reformer: 80');
                expect(result.value).toContain('The Helper: 75');
                expect(result.value).toContain('The Individualist: 85');
                expect(result.value).toContain('The Investigator: 70');
            }
        });
    });

    describe('generateDetailedSummary', () => {
        it('should generate detailed summary with assessment result', async () => {
            // Arrange
            const scores = {
                type1: 80,
                type2: 75,
                type3: 60,
                type4: 85,
                type5: 70,
                type6: 65,
                type7: 55,
                type8: 90,
                type9: 50
            };
            const assessmentResult = "This is a full detailed response";

            // Act
            const result = await enneagramHandler.generateDetailedSummary({ scores, assessmentResult });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('should handle empty assessment result', async () => {
            // Arrange
            const scores = {
                type1: 80,
                type2: 75,
                type3: 60,
                type4: 85,
                type5: 70,
                type6: 65,
                type7: 55,
                type8: 90,
                type9: 50
            };

            // Act
            const result = await enneagramHandler.generateDetailedSummary({ scores, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
            }
        });
    });
}); 