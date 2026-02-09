import { DependencyService } from "@src/core/injection/DependencyService";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { TestDataProvider } from "@src/providers/data/__tests__/TestDataProvider";
import { AUTH_PROVIDER_KEY } from "@src/providers/auth/AuthProvider";
import { TestAuthProvider } from "@src/providers/auth/__tests__/TestAuthProvider";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { TestLlmProvider } from "@src/providers/llm/__tests__/TestLlmProvider";
import { user$ } from "@src/models/SessionModel";
import { UserQuickInsightService } from "@src/services/UserQuickInsightService";
import { clearQuickInsights, UserQuickInsight } from "@src/models/UserQuickInsightModel";
import { UserQuickInsightViewModel } from "../UserQuickInsightViewModel";
import { withViewModel } from "../ViewModel";

describe('UserQuickInsightViewModel', () => {
    let viewModel: UserQuickInsightViewModel;
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
        });

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

        // Initialize the service first
        userQuickInsightService = DependencyService.resolve(UserQuickInsightService);
        await userQuickInsightService.initialize();

        // Initialize the ViewModel
        viewModel = await withViewModel(UserQuickInsightViewModel);

        // Clear any existing data
        clearQuickInsights();
        testDataProvider.clearTestData();
    });

    afterEach(async () => {
        await viewModel.end();
        await userQuickInsightService.end();
        await testDataProvider.end();
        await testAuthProvider.end();
        user$.set(null);
        clearQuickInsights();
    });

    it('should initialize successfully', () => {
        expect(viewModel).toBeDefined();
    });

    it('should get user insights', async () => {
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
        await userQuickInsightService.fetchUserInsights();

        // Act
        const insights = viewModel.insights$.get();

        // Assert
        expect(insights).toHaveLength(1);
        expect(insights[0].title).toBe(mockInsights[0].title);
        expect(insights[0].description).toBe(mockInsights[0].description);
    });

    it('should create a new insight', async () => {
        // Arrange
        const newInsight = {
            title: 'New Insight',
            description: 'This is a new insight'
        };

        // Act
        viewModel.currentTitle$.set(newInsight.title);
        viewModel.currentDescription$.set(newInsight.description);
        const result = await viewModel.createInsight();

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const insights = viewModel.insights$.get();
            expect(insights).toHaveLength(1);
            expect(insights[0].title).toBe(newInsight.title);
            expect(insights[0].description).toBe(newInsight.description);
            expect(insights[0].user_id).toBe(testUserId);

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
        await userQuickInsightService.fetchUserInsights();

        const updates = {
            title: 'Updated Insight',
            description: 'This is an updated insight'
        };

        // Act
        viewModel.currentTitle$.set(updates.title);
        viewModel.currentDescription$.set(updates.description);
        const result = await viewModel.updateInsight(mockInsight.id);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const insights = viewModel.insights$.get();
            expect(insights[0].title).toBe(updates.title);
            expect(insights[0].description).toBe(updates.description);
            expect(insights[0].id).toBe(mockInsight.id);

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
        await userQuickInsightService.fetchUserInsights();

        // Act
        const result = await viewModel.deleteInsight(mockInsight.id);

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
        viewModel.currentTitle$.set('Test');
        viewModel.currentDescription$.set('Description');
        const result = await viewModel.createInsight();

        // Assert
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('User not authenticated');
        }
    });

    it('should handle errors when insight is not found for update', async () => {
        // Act
        viewModel.currentTitle$.set('Updated Title');
        const result = await viewModel.updateInsight('non-existent-id');

        // Assert
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('Insight not found');
        }
    });

    it('should validate form data', () => {
        // Empty title and description
        viewModel.currentTitle$.set('');
        viewModel.currentDescription$.set('');
        expect(viewModel.isValid$.get()).toBe(false);

        // Valid title and description
        viewModel.currentTitle$.set('Valid Title');
        viewModel.currentDescription$.set('Valid Description');
        expect(viewModel.isValid$.get()).toBe(true);

        // Title too long
        viewModel.currentTitle$.set('a'.repeat(201));
        expect(viewModel.isValid$.get()).toBe(false);

        // Description too long
        viewModel.currentTitle$.set('Valid Title');
        viewModel.currentDescription$.set('a'.repeat(2001));
        expect(viewModel.isValid$.get()).toBe(false);
    });

    it('should reset form', () => {
        // Arrange
        viewModel.currentTitle$.set('Test Title');
        viewModel.currentDescription$.set('Test Description');
        viewModel.error$.set('Test Error');

        // Act
        viewModel.resetForm();

        // Assert
        expect(viewModel.currentTitle$.get()).toBe('');
        expect(viewModel.currentDescription$.get()).toBe('');
        expect(viewModel.error$.get()).toBe(null);
    });
}); 