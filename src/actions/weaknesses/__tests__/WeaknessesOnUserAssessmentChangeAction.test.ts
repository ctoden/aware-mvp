import {DependencyService} from "@src/core/injection/DependencyService";
import {DATA_PROVIDER_KEY} from "@src/providers/data/DataProvider";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {WeaknessesOnUserAssessmentChangeAction} from "../WeaknessesOnUserAssessmentChangeAction";
import {UserAssessment} from "@src/models/UserAssessment";
import {UserWeakness, userWeaknesses$, WeaknessType} from "@src/models/UserWeakness";
import {WeaknessesService} from "@src/services/WeaknessesService";
import {user$} from "@src/models/SessionModel";

describe('WeaknessesOnUserAssessmentChangeAction', () => {
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;
    let weaknessesService: WeaknessesService;
    let action: WeaknessesOnUserAssessmentChangeAction;

    const mockUserId = 'test-user-id';
    const mockUser = {
        id: mockUserId,
        app_metadata: { provider: 'email' },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email: 'test@example.com',
        phone: '',
        role: 'authenticated',
        confirmation_sent_at: undefined,
        confirmed_at: undefined,
        recovery_sent_at: undefined,
        email_confirmed_at: undefined,
        email_change_sent_at: undefined,
        last_sign_in_at: undefined,
        banned_until: undefined,
        reauthentication_sent_at: undefined,
        identities: undefined
    };

    beforeEach(async () => {
        // Reset observables
        userWeaknesses$.set(null);
        user$.set(null);

        // Setup test providers
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();

        testLlmProvider = TestLlmProvider.getInstance();
        await testLlmProvider.initialize();

        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Initialize the service
        weaknessesService = new WeaknessesService();
        await weaknessesService.initialize();

        // Create the action with the actual service
        action = new WeaknessesOnUserAssessmentChangeAction(weaknessesService);

        // Set up the user
        user$.set(mockUser);
    });

    afterEach(async () => {
        testLlmProvider.clearMockResponses();
        testDataProvider.clearTestData();
        await weaknessesService.end();
    });

    it('should process assessments and create weaknesses', async () => {
        // Setup
        const mockAssessments: UserAssessment[] = [
            {
                id: '1',
                user_id: mockUserId,
                assessment_type: 'PERSONALITY',
                assessment_summary: 'User is creative and ambitious.',
                assessment_full_text: 'User is creative and ambitious.',
                name: 'Personality Assessment',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        const mockLlmResponse = JSON.stringify([
            {
                title: 'Time Management',
                description: 'You sometimes struggle to prioritize tasks effectively, though you\'re actively working on improving your organizational skills.'
            },
            {
                title: 'Public Speaking',
                description: 'You feel less confident when presenting to large groups, but your preparation and practice are steadily building your comfort level.'
            },
            {
                title: 'Detail Focus',
                description: 'Your big-picture thinking occasionally leads to overlooking smaller details, though this same trait enables creative problem-solving.'
            },
            {
                title: 'Decision Making',
                description: 'You tend to spend extra time weighing options before making decisions, but this thoroughness often leads to better outcomes.'
            }
        ]);

        testLlmProvider.setNextResponse(mockLlmResponse);

        // Execute
        const result = await action.execute(mockAssessments);

        // Assert
        expect(result.isOk()).toBe(true);
        
        // Verify the weaknesses were created in the data provider
        const storedWeaknesses = await testDataProvider.fetchData<UserWeakness>('user_weaknesses', {
            filter: [{ field: 'user_id', value: mockUserId }]
        });
        expect(storedWeaknesses.isOk()).toBe(true);
        if (storedWeaknesses.isOk()) {
            expect(storedWeaknesses.value).toHaveLength(4);
            expect(storedWeaknesses.value[0].title).toBe('Time Management');
            expect(storedWeaknesses.value[0].weakness_type).toBe(WeaknessType.SYSTEM_GENERATED);
        }

        // Verify the observable state was updated
        const weaknesses = userWeaknesses$.peek();
        expect(weaknesses).toBeDefined();
        if (weaknesses) {
            const weaknessArray = Object.values(weaknesses);
            expect(weaknessArray).toHaveLength(4);
            expect(weaknessArray.some(w => w.title === 'Time Management')).toBe(true);
        }
    });

    it('should get back a valid response', async () => {
        // Setup
        const mockAssessments: UserAssessment[] = [
            {
                id: '1',
                user_id: mockUserId,
                assessment_type: 'PERSONALITY',
                assessment_summary: 'User is creative and ambitious.',
                assessment_full_text: 'User is creative and ambitious.',
                name: 'Personality Assessment',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        const mockLlmResponse = JSON.stringify([
            {
                title: 'Time Management',
                description: 'You sometimes struggle to prioritize tasks effectively, though you\'re actively working on improving your organizational skills.'
            },
            {
                title: 'Public Speaking',
                description: 'You feel less confident when presenting to large groups, but your preparation and practice are steadily building your comfort level.'
            },
            {
                title: 'Detail Focus',
                description: 'Your big-picture thinking occasionally leads to overlooking smaller details, though this same trait enables creative problem-solving.'
            },
            {
                title: 'Decision Making',
                description: 'You tend to spend extra time weighing options before making decisions, but this thoroughness often leads to better outcomes.'
            }
        ]);

        testLlmProvider.setNextResponse(mockLlmResponse);

        // Force the data provider to fail by setting an empty array
        testDataProvider.setTestData('user_weaknesses', []);

        // Execute
        const result = await action.execute(mockAssessments);

        // Assert
        expect(result.isErr()).toBe(false);
        expect(result.isOk()).toBe(true);
    });

    it('should handle error when LLM provider fails', async () => {
        // Setup
        const mockAssessments: UserAssessment[] = [
            {
                id: '1',
                user_id: mockUserId,
                assessment_type: 'PERSONALITY',
                assessment_summary: 'User is creative and ambitious.',
                assessment_full_text: 'User is creative and ambitious.',
                name: 'Personality Assessment',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        // Don't set a mock response, which will cause the LLM provider to return a random response
        // that won't match our expected format

        // Execute
        const result = await action.execute(mockAssessments);

        // Assert
        expect(result.isErr()).toBe(true);
        const weaknesses = userWeaknesses$.peek();
        expect(weaknesses).toBeNull();
    });
});