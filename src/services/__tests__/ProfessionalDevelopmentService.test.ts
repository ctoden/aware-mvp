import { DependencyService } from "@src/core/injection/DependencyService";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { TestDataProvider } from "@src/providers/data/__tests__/TestDataProvider";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { MistralLlmProvider } from "@src/providers/llm/MistralLlmProvider";
import { ProfessionalDevelopmentService } from "../ProfessionalDevelopmentService";
import { user$ } from "@src/models/SessionModel";
import { userAssessments$ } from "@src/models/UserAssessment";
import { professionalDevelopment$ } from "@src/models/ProfessionalDevelopment";
import { get } from "lodash";

function awaitProfessionalDevelopment(): Promise<void> {
    return new Promise(async (resolve) => {
        let continueLoop = true;
        const setT = setTimeout(() => {
            continueLoop = false;
            resolve(void 0);
        }, 15000);
        while(continueLoop && !professionalDevelopment$.peek()) {
            await new Promise(r => setTimeout(r, 100));
        }
        clearTimeout(setT);
        resolve(void 0);
    });
}

describe('ProfessionalDevelopmentService', () => {
    let professionalDevelopmentService: ProfessionalDevelopmentService;
    let testDataProvider: TestDataProvider;
    let llmProvider: MistralLlmProvider;
    let apiKeyFromTestEnv: string;
    const TABLE_NAME = 'user_professional_development';

    beforeAll(() => {
        // Get API key from test environment
        apiKeyFromTestEnv = get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY') as unknown as string;
    });

    beforeEach(async () => {
        // Set up test data provider
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);

        // Set up LLM provider
        DependencyService.registerValue("MISTRAL_API_KEY", apiKeyFromTestEnv);
        DependencyService.registerValue("MISTRAL_DEFAULT_MODEL", "open-mistral-nemo");
        llmProvider = new MistralLlmProvider();
        await llmProvider.initialize();
        DependencyService.registerValue(LLM_PROVIDER_KEY, llmProvider);

        // Set up mock user
        user$.set({
            id: 'test-user-id',
            app_metadata: {},
            user_metadata: {},
            aud: 'test-user-id',
            confirmation_sent_at: undefined,
            recovery_sent_at: undefined,
            email_change_sent_at: undefined,
            email: 'test@example.com',
            created_at: new Date().toISOString(),
        });

        // Initialize service
        professionalDevelopmentService = new ProfessionalDevelopmentService();
        await professionalDevelopmentService.initialize();
    });

    afterEach(async () => {
        await professionalDevelopmentService.end();
        await testDataProvider.end();
        await llmProvider.end();
        user$.set(null);
        userAssessments$.set([]);
        professionalDevelopment$.set(null);
    });

    afterAll(() => {
        DependencyService.unregister(DATA_PROVIDER_KEY);
        DependencyService.unregister(LLM_PROVIDER_KEY);
        DependencyService.unregister('MISTRAL_API_KEY');
        DependencyService.unregister('MISTRAL_DEFAULT_MODEL');
    });

    it('should generate professional development when assessments change', async () => {
        // Arrange
        const assessments = [{
            id: 'test-assessment-1',
            user_id: 'test-user-id',
            assessment_type: 'MBTI',
            name: 'MBTI Assessment',
            assessment_data: {},
            assessment_result: 'INFJ',
            assessment_full_text: null,
            assessment_summary: 'You are an INFJ personality type. You are insightful, caring, and creative.',
            created_at: new Date().toISOString(),
            updated_at: new Date(Date.now() + 6000).toISOString()
        }];

        // Act
        userAssessments$.set(assessments);

        // Wait for async operations to complete
        await awaitProfessionalDevelopment();

        // Assert
        const profDev = professionalDevelopment$.peek();
        expect(profDev).not.toBeNull();
        if (profDev) {
            expect(profDev.user_id).toBe('test-user-id');
            expect(profDev.key_terms).toBeDefined();
            expect(profDev.key_terms.length).toBeGreaterThan(0);
            expect(profDev.description).toBeTruthy();
            expect(profDev.leadership_style_title).toBeTruthy();
            expect(profDev.leadership_style_description).toBeTruthy();
            expect(profDev.goal_setting_style_title).toBeTruthy();
            expect(profDev.goal_setting_style_description).toBeTruthy();

            // Verify data was stored through the TestDataProvider
            const result = await professionalDevelopmentService.fetchProfessionalDevelopment('test-user-id');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.key_terms.length).toBeGreaterThan(0);
            }
        }
    }, 300_000); // Increased timeout for LLM responses

    it('should clear professional development when user signs out', async () => {
        // Arrange - First create some professional development
        const assessments = [{
            id: 'test-assessment-1',
            user_id: 'test-user-id',
            assessment_type: 'MBTI',
            name: 'MBTI Assessment',
            assessment_data: {},
            assessment_result: 'INFJ',
            assessment_full_text: null,
            assessment_summary: 'You are an INFJ personality type. You are insightful, caring, and creative.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }];

        userAssessments$.set(assessments);
        await awaitProfessionalDevelopment();

        // Act - Sign out user
        user$.set(null);

        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Assert
        expect(professionalDevelopment$.peek()).toBeNull();
    }, 300_000);
}); 