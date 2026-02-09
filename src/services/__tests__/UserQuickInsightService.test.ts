import {DependencyService} from "@src/core/injection/DependencyService";
import {DATA_PROVIDER_KEY} from "@src/providers/data/DataProvider";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";
import {UserQuickInsightService} from "../UserQuickInsightService";
import {clearQuickInsights, UserQuickInsight} from "@src/models/UserQuickInsightModel";
import {AUTH_PROVIDER_KEY} from "@src/providers/auth/AuthProvider";
import {TestAuthProvider} from "@src/providers/auth/__tests__/TestAuthProvider";
import {user$} from "@src/models/SessionModel";
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";

describe('UserQuickInsightService', () => {
    let userQuickInsightService: UserQuickInsightService;
    let testDataProvider: TestDataProvider;
    let testAuthProvider: TestAuthProvider;
    let testLlmProvider: TestLlmProvider;
    const testUserId = 'test-user-id';

    const mockProfile = {
        id: 'test-user-id',
        full_name: 'Test User',
        avatar_url: null,
        website: null,
        summary: null,
        phone_number: null,
        birth_date: new Date('1990-01-01'),
        updated_at: null
    };

    beforeEach(async () => {
        // Create and initialize the test providers
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        
        testAuthProvider = new TestAuthProvider();
        await testAuthProvider.initialize();

        testDataProvider.setTestData('user_profiles', [mockProfile]);
        testLlmProvider = new TestLlmProvider();
        testAuthProvider.setSession({
            access_token: 'test_token',
            user: { id: 'test-user-id', email: 'test@example.com' }
        })

        // Register the providers
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Set up test user
        user$.set({
            id: testUserId,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
        });

        // Create and initialize the service
        userQuickInsightService = DependencyService.resolve(UserQuickInsightService);
        await userQuickInsightService.initialize();

        // Clear any existing data
        clearQuickInsights();
        testDataProvider.clearTestData();
    });

    afterEach(async () => {
        await userQuickInsightService.end();
        await testDataProvider.end();
        await testAuthProvider.end();
        user$.set(null);
        clearQuickInsights();
    });

    it('should initialize successfully', async () => {
        expect(userQuickInsightService).toBeDefined();
    });

    it('should fetch user insights', async () => {
        // Arrange
        const mockInsights = [
            {
                id: '1',
                user_id: testUserId,
                title: 'Test Insight',
                description: 'This is a test insight',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        await testDataProvider.upsertData('user_quick_insights', mockInsights);

        // Act
        const result = await userQuickInsightService.fetchUserInsights();

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(1);
            expect(result.value[0].title).toBe(mockInsights[0].title);
            expect(result.value[0].description).toBe(mockInsights[0].description);
        }
    });

    it('should create a new insight', async () => {
        // Arrange
        const newInsight = {
            title: 'New Insight',
            description: 'This is a new insight'
        };

        // Act
        const result = await userQuickInsightService.createInsight(newInsight.title, newInsight.description);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.title).toBe(newInsight.title);
            expect(result.value.description).toBe(newInsight.description);
            expect(result.value.user_id).toBe(testUserId);

            // Verify it was saved to the data provider
            const fetchResult = await testDataProvider.fetchData<UserQuickInsight>('user_quick_insights', {
                filter: [{ field: 'user_id', value: testUserId }]
            });
            expect(fetchResult.isOk()).toBe(true);
            if (fetchResult.isOk()) {
                expect(fetchResult.value).toHaveLength(1);
                expect(fetchResult.value[0].title).toBe(newInsight.title);
            }
        }
    });

    it('should update an insight', async () => {
        // Arrange
        const mockInsight = {
            id: '1',
            user_id: testUserId,
            title: 'Test Insight',
            description: 'This is a test insight',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        await testDataProvider.upsertData('user_quick_insights', [mockInsight]);

        const updates = {
            title: 'Updated Insight',
            description: 'This is an updated insight'
        };

        // Act
        const result = await userQuickInsightService.updateInsight(mockInsight.id, updates);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.title).toBe(updates.title);
            expect(result.value.description).toBe(updates.description);
            expect(result.value.id).toBe(mockInsight.id);

            // Verify it was updated in the data provider
            const fetchResult = await testDataProvider.fetchData<UserQuickInsight>('user_quick_insights', {
                filter: [{ field: 'id', value: mockInsight.id }]
            });
            expect(fetchResult.isOk()).toBe(true);
            if (fetchResult.isOk()) {
                expect(fetchResult.value[0].title).toBe(updates.title);
            }
        }
    });

    it('should delete an insight', async () => {
        // Arrange
        const mockInsight = {
            id: '1',
            user_id: testUserId,
            title: 'Test Insight',
            description: 'This is a test insight',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        await testDataProvider.upsertData('user_quick_insights', [mockInsight]);

        // Act
        const result = await userQuickInsightService.deleteInsight(mockInsight.id);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            // Verify it was deleted from the data provider
            const fetchResult = await testDataProvider.fetchData<UserQuickInsight>('user_quick_insights', {
                filter: [{ field: 'id', value: mockInsight.id }]
            });
            expect(fetchResult.isOk()).toBe(true);
            if (fetchResult.isOk()) {
                expect(fetchResult.value).toHaveLength(0);
            }
        }
    });

    it('should handle errors when user is not authenticated', async () => {
        // Arrange
        user$.set(null);
        testAuthProvider.setSession(null);

        // Act
        const result = await userQuickInsightService.createInsight('Test', 'Description');

        // Assert
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('User not authenticated');
        }
    });

    it('should handle errors when insight is not found for update', async () => {
        // Act
        const result = await userQuickInsightService.updateInsight('non-existent-id', {
            title: 'Updated Title'
        });

        // Assert
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('Insight not found');
        }
    });
});