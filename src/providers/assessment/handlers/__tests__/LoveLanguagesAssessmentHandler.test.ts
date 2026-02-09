import { LoveLanguagesAssessmentHandler } from '../LoveLanguagesAssessmentHandler';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LlmService } from '@src/services/LlmService';
import { ILlmProvider, LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { userProfile$ } from '@src/models/UserProfile';
import { MistralLlmProvider } from "@src/providers/llm/MistralLlmProvider";
import { get } from 'lodash';

describe('LoveLanguagesAssessmentHandler', () => {
    let loveLanguagesHandler: LoveLanguagesAssessmentHandler;
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

        // Create the Love Languages handler
        loveLanguagesHandler = new LoveLanguagesAssessmentHandler(testUserId);
    });

    afterEach(async () => {
        await llmService.end();
        await testLlmProvider.end();
        userProfile$.summary.set('');
    });

    describe('generateSummary', () => {
        it('should generate summary from Love Languages selection', async () => {
            // Arrange
            const selectedLanguage = 'Words of Affirmation';

            // Act
            const result = await loveLanguagesHandler.generateSummary({ selectedLanguage, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('Primary Love Language: Words of Affirmation');
                expect(result.value).toContain('Description: Expressing affection through spoken affirmation');
            }
        });

        it('should handle unknown love language', async () => {
            // Arrange
            const selectedLanguage = 'Unknown Language';

            // Act
            const result = await loveLanguagesHandler.generateSummary({ selectedLanguage, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('Primary Love Language: Unknown Language');
            }
        });
    });

    describe('generateDetailedSummary', () => {
        it('should generate detailed summary with assessment result', async () => {
            // Arrange
            const selectedLanguage = 'Quality Time';
            const assessmentResult = "This is a full detailed response";

            // Act
            const result = await loveLanguagesHandler.generateDetailedSummary({ selectedLanguage, assessmentResult });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('should handle empty assessment result', async () => {
            // Arrange
            const selectedLanguage = 'Physical Touch';

            // Act
            const result = await loveLanguagesHandler.generateDetailedSummary({ selectedLanguage, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
            }
        });
    });
}); 