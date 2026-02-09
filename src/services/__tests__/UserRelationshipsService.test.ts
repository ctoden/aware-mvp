import { DependencyService } from "@src/core/injection/DependencyService";

import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { UserRelationshipsService } from "../UserRelationshipsService";
import { MistralLlmProvider } from "@src/providers/llm/MistralLlmProvider";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { UserAssessment, userAssessments$ } from "@src/models/UserAssessment";
import { user$ } from "@src/models/SessionModel";
import { get } from "lodash";
import { userRelationships$ } from "@src/models/UserRelationship";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";

function awaitUserRelationships(): Promise<void> {
    return new Promise(async (resolve) => {
        let continueLoop = true;
        const setT = setTimeout(() => {
            continueLoop = false;
            resolve(void 0);
        }, 15000);
        while(continueLoop && Object.values(userRelationships$.peek() || {}).length === 0) {
            await new Promise(r => setTimeout(r, 100));
        }
        clearTimeout(setT);
        resolve(void 0);
    });
}

describe('UserRelationshipsService', () => {
    let relationshipsService: UserRelationshipsService;
    let testDataProvider: TestDataProvider;
    let llmProvider: MistralLlmProvider;
    let apiKeyFromTestEnv: string;

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
        relationshipsService = new UserRelationshipsService();
        await relationshipsService.initialize();
    });

    afterEach(async () => {
        await relationshipsService.end();
        await testDataProvider.end();
        await llmProvider.end();
        user$.set(null);
        userAssessments$.set([]);
        userRelationships$.set(null);
    });

    afterAll(() => {
        DependencyService.unregister(DATA_PROVIDER_KEY);
        DependencyService.unregister(LLM_PROVIDER_KEY);
        DependencyService.unregister('MISTRAL_API_KEY');
        DependencyService.unregister('MISTRAL_DEFAULT_MODEL');
    });

    it('should generate relationships when assessments change', async () => {
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
            updated_at: new Date(Date.now() + 60000).toISOString()
        }];

        // Act
        userAssessments$.set(assessments as UserAssessment[]);

        // Wait for async operations to complete
        await awaitUserRelationships();

        // Assert
        const relationships = userRelationships$.peek();
        expect(relationships).not.toBeNull();
        
        const relationshipArray = Object.values(relationships || {});
        expect(relationshipArray.length).toBeGreaterThan(0);

        const relationship = relationshipArray[0];
        expect(relationship.user_id).toBe('test-user-id');
        expect(relationship.key_terms).toHaveLength(5);
        expect(relationship.description).toBeTruthy();
        expect(relationship.communication_style_title).toBeTruthy();
        expect(relationship.communication_style_description).toBeTruthy();
        expect(relationship.conflict_style_title).toBeTruthy();
        expect(relationship.conflict_style_description).toBeTruthy();
        expect(relationship.attachment_style_title).toBeTruthy();
        expect(relationship.attachment_style_description).toBeTruthy();

        // Verify data was stored through the TestDataProvider
        const result = await relationshipsService.fetchUserRelationships('test-user-id'); 
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.length).toBeGreaterThan(0);
            expect(result.value[0].key_terms).toHaveLength(5);
        }
    }, 300_000); // Increased timeout for LLM responses

    it('should clear relationships when user signs out', async () => {
        // Arrange - First create some relationships
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
        await awaitUserRelationships();

        // Act - Sign out user
        user$.set(null);

        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Assert
        expect(userRelationships$.peek()).toBeNull();
    }, 300_000);
}); 