import { MotivationCodeAssessmentHandler } from '../MotivationCodeAssessmentHandler';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LlmService } from '@src/services/LlmService';
import { ILlmProvider, LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { userProfile$ } from '@src/models/UserProfile';
import { MistralLlmProvider } from "@src/providers/llm/MistralLlmProvider";
import { get } from 'lodash';

describe('MotivationCodeAssessmentHandler', () => {
    let motivationCodeHandler: MotivationCodeAssessmentHandler;
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

        // Create the Motivation Code handler
        motivationCodeHandler = new MotivationCodeAssessmentHandler(testUserId);
    });

    afterEach(async () => {
        await llmService.end();
        await testLlmProvider.end();
        userProfile$.summary.set('');
    });

    describe('generateSummary', () => {
        it('should generate summary from valid motivations', async () => {
            // Arrange
            const motivations = ['Achievement', 'Growth', 'Impact', 'Innovation', 'Leadership'];

            // Act
            const result = await motivationCodeHandler.generateSummary({ motivations, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('Top 5 Motivations:');
                expect(result.value).toContain('1. Achievement:');
                expect(result.value).toContain('2. Growth:');
                expect(result.value).toContain('3. Impact:');
                expect(result.value).toContain('4. Innovation:');
                expect(result.value).toContain('5. Leadership:');
            }
        });

        it('should handle unknown motivations', async () => {
            // Arrange
            const motivations = ['Unknown1', 'Unknown2', 'Unknown3', 'Unknown4', 'Unknown5'];

            // Act
            const result = await motivationCodeHandler.generateSummary({ motivations, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('Top 5 Motivations:');
                motivations.forEach((motivation, index) => {
                    expect(result.value).toContain(`${index + 1}. ${motivation}`);
                });
            }
        });
    });

    describe('generateDetailedSummary', () => {
        it('should generate detailed summary with assessment result', async () => {
            // Arrange
            const motivations = ['Excellence', 'Purpose', 'Service', 'Teamwork', 'Learning'];
            const assessmentResult = "This is a full detailed response about the motivations";

            // Act
            const result = await motivationCodeHandler.generateDetailedSummary({ motivations, assessmentResult });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.length).toBeGreaterThanOrEqual(1);
            }
        });

        it('should handle empty assessment result', async () => {
            // Arrange
            const motivations = ['Mastery', 'Recognition', 'Discovery', 'Challenge', 'Creativity'];

            // Act
            const result = await motivationCodeHandler.generateDetailedSummary({ motivations, assessmentResult: null });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBeTruthy();
            }
        });
    });
}); 