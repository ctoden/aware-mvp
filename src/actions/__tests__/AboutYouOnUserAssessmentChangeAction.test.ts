import {AboutYouOnUserAssessmentChangeAction} from '../aboutYou/AboutYouOnUserAssessmentChangeAction';
import {MistralLlmProvider} from '@src/providers/llm/MistralLlmProvider';
import {TestDataProvider} from '@src/providers/data/__tests__/TestDataProvider';
import {DependencyService} from '@src/core/injection/DependencyService';
import {LLM_PROVIDER_KEY} from '@src/providers/llm/LlmProvider';
import {DATA_PROVIDER_KEY} from '@src/providers/data/DataProvider';
import {AboutYouSectionType, UserAboutYou, userAboutYou$, getUserAboutYouArray, getEntriesBySection} from '@src/models/UserAboutYou';
import {user$} from '@src/models/SessionModel';
import {UserAssessment} from '@src/models/UserAssessment';
import {LlmService} from '@src/services/LlmService';
import {AboutYouService} from "@src/services/AboutYouService";
import {get} from "lodash";

describe('AboutYouOnUserAssessmentChangeAction', () => {
    let action: AboutYouOnUserAssessmentChangeAction;
    let mistralProvider: MistralLlmProvider;
    let testDataProvider: TestDataProvider;
    let llmService: LlmService;
    let aboutYouService: AboutYouService;
    let apiKeyFromTestEnv: string;

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

    const mockAssessments: UserAssessment[] = [
        {
            id: '1',
            user_id: mockUser.id,
            name: 'Personality Test',
            assessment_type: 'MBTI',
            assessment_summary: 'INTP - Analytical and logical thinking',
            assessment_full_text: 'Full MBTI assessment text',
            created_at: new Date().toISOString(),
            updated_at: new Date(Date.now()+5000).toISOString()
        }
    ];

    const mockAboutYouEntries: UserAboutYou[] = [
        {
            id: '1',
            user_id: mockUser.id,
            title: 'Communication Style',
            description: 'Direct and analytical communication',
            section_type: AboutYouSectionType.SELF_AWARENESS,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    beforeAll(() => {
        apiKeyFromTestEnv = get(global, 'test.env.EXPO_PUBLIC_MISTRAL_API_KEY') as unknown as string;
    });

    beforeEach(async () => {
        // Reset observables
        user$.set(null);
        userAboutYou$.set(null);

        // Setup providers
        DependencyService.registerValue("MISTRAL_API_KEY", apiKeyFromTestEnv);
        DependencyService.registerValue("MISTRAL_DEFAULT_MODEL", "open-mistral-nemo");
        mistralProvider = new MistralLlmProvider();
        await mistralProvider.initialize();

        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();

        DependencyService.registerValue(LLM_PROVIDER_KEY, mistralProvider);
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);

        // Resolve LlmService instance
        llmService = DependencyService.resolve(LlmService);
        await llmService.initialize();

        // Setup test data
        testDataProvider.setTestData('user_about_you', mockAboutYouEntries);

        aboutYouService = DependencyService.resolve(AboutYouService);
        await aboutYouService.initialize();

        // Set up test user
        user$.set(mockUser);

        // Create action instance
        action = new AboutYouOnUserAssessmentChangeAction(aboutYouService);

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    });

    afterEach(async () => {
        // Clean up
        await aboutYouService.end();
        await mistralProvider.end();
        await testDataProvider.end();
        await llmService.end();

        user$.set(null);
        userAboutYou$.set(null);

        // Unregister dependencies
        DependencyService.unregister(LLM_PROVIDER_KEY);
        DependencyService.unregister(DATA_PROVIDER_KEY);
        DependencyService.unregister('MISTRAL_API_KEY');
        DependencyService.unregister('MISTRAL_DEFAULT_MODEL');
    });

    it('should process assessments and create entries for all sections', async () => {
        // Get initial state
        const initialEntries = getUserAboutYouArray();
        expect(initialEntries.length).toBe(1); // Our mock entry

        const result = await action.execute(mockAssessments, true);
        expect(result.isOk()).toBe(true);

        // Verify entries were created
        const updatedEntries = getUserAboutYouArray();
        expect(updatedEntries.length).toBeGreaterThan(initialEntries.length);

        // Verify entries for each section type
        Object.values(AboutYouSectionType).forEach(sectionType => {
            const sectionEntries = getEntriesBySection(sectionType);
            expect(sectionEntries.length).toBeGreaterThan(0);
            
            // Verify entry structure
            sectionEntries.forEach(entry => {
                expect(entry.user_id).toBe(mockUser.id);
                expect(entry.title).toBeTruthy();
                expect(entry.description).toBeTruthy();
                expect(entry.section_type).toBe(sectionType);
            });
        });
    }, 10000);

    it('should handle empty assessments array', async () => {
        // Get initial state
        const initialEntries = getUserAboutYouArray();
        
        const result = await action.execute([]);
        expect(result.isOk()).toBe(true);

        // Verify no new entries were created
        const updatedEntries = getUserAboutYouArray();
        expect(updatedEntries.length).toBe(initialEntries.length);
    });

    it('should combine multiple assessment summaries in context', async () => {
        const multipleAssessments = [
            ...mockAssessments,
            {
                id: '2',
                user_id: mockUser.id,
                name: 'Big Five',
                assessment_type: 'BIG_FIVE',
                assessment_summary: 'High openness and conscientiousness',
                assessment_full_text: 'Full Big Five assessment text',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        // Get initial state
        const initialEntries = getUserAboutYouArray();

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        const result = await action.execute(multipleAssessments, true);
        expect(result.isOk()).toBe(true);

        // Verify new entries were created
        const updatedEntries = getUserAboutYouArray();
        expect(updatedEntries.length).toBeGreaterThan(initialEntries.length);

        // Verify entries contain insights from both assessments
        const allEntries = getUserAboutYouArray();
        const hasPersonalityInsights = allEntries.some(entry => 
            entry.description.toLowerCase().includes('analytical') || 
            entry.description.toLowerCase().includes('intp')
        );
        const hasBigFiveInsights = allEntries.some(entry => 
            entry.description.toLowerCase().includes('openness') || 
            entry.description.toLowerCase().includes('conscientiousness')
        );

        expect(hasPersonalityInsights).toBe(true);
        expect(hasBigFiveInsights).toBe(true);
    }, 10000);
}); 