import { MBTIAssessmentHandler } from '../MBTIAssessmentHandler';
import { DependencyService } from '@src/core/injection/DependencyService';
import { LlmService } from '@src/services/LlmService';
import { TestLlmProvider } from '@src/providers/llm/__tests__/TestLlmProvider';
import {ILlmProvider, LLM_PROVIDER_KEY} from '@src/providers/llm/LlmProvider';
import { userProfile$ } from '@src/models/UserProfile';
import { MBTIDichotomies } from '@src/models/assessments/mbti';
import {MistralLlmProvider} from "@src/providers/llm/MistralLlmProvider";
import { get } from 'lodash';

describe('MBTIAssessmentHandler', () => {
    let mbtiHandler: MBTIAssessmentHandler;
    let testLlmProvider: ILlmProvider;
    let llmService: LlmService;

    const testUserId = 'test-user-id';

    beforeEach(async () => {
        // Set up the test LLM provider
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

        // Create the MBTI handler
        mbtiHandler = new MBTIAssessmentHandler(testUserId);
    });

    afterEach(async () => {
        await llmService.end();
        await testLlmProvider.end();
        userProfile$.summary.set('');
    });

    describe('generateSummary', () => {
        it('should generate summary from MBTI dichotomies', async () => {
            // Arrange
            const dichotomies: MBTIDichotomies = {
                energy: 'E',
                information: 'N', 
                decision: 'T',
                lifestyle: 'J'
            };

            // Act
            const result = await mbtiHandler.generateSummary({ dichotomies, assessmentResult: null});

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toContain('E - Extroversion');
                expect(result.value).toContain('N - Intuition');
                expect(result.value).toContain('T - Thinking');
                expect(result.value).toContain('J - Judging');
            }
        });

        it('should handle empty dichotomies', async () => {
            // Arrange
            const dichotomies: MBTIDichotomies = {
                energy: null,
                information: 'N',
                decision: 'T',
                lifestyle: 'J'
            };

            // Act
            const result = await mbtiHandler.generateSummary({ dichotomies, assessmentResult: null});

            // Assert
            expect(result.isOk()).toBe(true);
        });
    });

    describe('should generate detailed summary', () => {
        it('should generate detailed summary from MBTI dichotomies', async () => {
            // Arrange
            const dichotomies: MBTIDichotomies = {
                energy: 'E',
                information: 'N',
                decision: 'T',
                lifestyle: 'J'
            };

            // Act
            const result = await mbtiHandler.generateDetailedSummary({dichotomies, assessmentResult: "This is a full detailed response"});
            expect(result.isOk()).toBe(true);
        });
    });
}); 