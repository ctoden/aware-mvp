import {DependencyService} from "@src/core/injection/DependencyService";
import {DATA_PROVIDER_KEY} from "@src/providers/data/DataProvider";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {WeaknessesService} from "../WeaknessesService";
import {userWeaknesses$} from "@src/models/UserWeakness";
import {user$} from "@src/models/SessionModel";
import {userAssessments$} from "@src/models/UserAssessment";

describe('WeaknessesService', () => {
    let weaknessesService: WeaknessesService;
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;

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
        userAssessments$.set([]);

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
    });

    afterEach(() => {
        testLlmProvider.clearMockResponses();
    });

    it('should initialize successfully', () => {
        expect(weaknessesService).toBeDefined();
    });

    it('should create a new weakness', async () => {
        // Setup
        user$.set(mockUser);
        const mockWeakness = {
            title: 'Time Management',
            description: 'You sometimes struggle to prioritize tasks effectively, though you\'re actively working on improving your organizational skills.'
        };

        // Execute
        const result = await weaknessesService.createWeakness(mockWeakness);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.title).toBe(mockWeakness.title);
            expect(result.value.description).toBe(mockWeakness.description);
            expect(result.value.user_id).toBe(mockUserId);
        }
    }, 100_000);

    it('should fetch user weaknesses', async () => {
        testDataProvider.clearTestData();
        // Setup
        const mockWeaknesses = [
            {
                id: '1',
                user_id: mockUserId,
                title: 'Time Management',
                description: 'You sometimes struggle to prioritize tasks effectively.',
                weakness_type: 'SYSTEM_GENERATED',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        await testDataProvider.upsertData('user_weaknesses', mockWeaknesses);

        // Execute
        const result = await weaknessesService.fetchUserWeaknesses(mockUserId);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(1);
            expect(result.value[0].title).toBe(mockWeaknesses[0].title);
        }
    });

    it('should update weakness', async () => {
        testDataProvider.clearTestData();
        // Setup
        user$.set(mockUser);
        // let the on change handler run
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockWeakness = {
            title: 'Time Management',
            description: 'Initial description'
        };
        const createResult = await weaknessesService.createWeakness(mockWeakness);
        expect(createResult.isOk()).toBe(true);
        if (!createResult.isOk()) return;

        const updates = {
            description: 'Updated description'
        };

        // Execute
        const result = await weaknessesService.updateWeakness(createResult.value.id, updates);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.description).toBe(updates.description);
        }
    });

    it('should delete weakness', async () => {
        testDataProvider.clearTestData();
        // Setup
        user$.set(mockUser);
        const mockWeakness = {
            title: 'Time Management',
            description: 'Test description'
        };
        const createResult = await weaknessesService.createWeakness(mockWeakness);
        expect(createResult.isOk()).toBe(true);
        if (!createResult.isOk()) return;

        // Execute
        const result = await weaknessesService.deleteWeakness(createResult.value.id);

        // Assert
        expect(result.isOk()).toBe(true);
        const weaknesses = userWeaknesses$.peek();
        expect(weaknesses).toEqual({});
    });

    it('should generate new weaknesses when assessments change', async () => {
        // Setup
        user$.set(mockUser);
        const mockAssessments = [
            {
                id: '1',
                user_id: mockUserId,
                assessment_type: 'PERSONALITY',
                assessment_summary: 'User is creative and ambitious.',
                assessment_full_text: 'User is creative and ambitious.',
                name: 'Personality Assessment',
                created_at: new Date().toISOString(),
                updated_at: new Date(Date.now() + 6000).toISOString()
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
        userAssessments$.set(mockAssessments);

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 100));

        // Assert
        const weaknesses = userWeaknesses$.peek();
        expect(weaknesses).toBeDefined();
        if (weaknesses) {
            const weaknessArray = Object.values(weaknesses);
            expect(weaknessArray).toHaveLength(4);
            expect(weaknessArray.some(w => w.title === 'Time Management')).toBe(true);
            expect(weaknessArray.some(w => w.title === 'Public Speaking')).toBe(true);
            expect(weaknessArray.some(w => w.title === 'Detail Focus')).toBe(true);
            expect(weaknessArray.some(w => w.title === 'Decision Making')).toBe(true);
        }
    });
}); 