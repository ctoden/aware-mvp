import {DependencyService} from "@src/core/injection/DependencyService";
import {DATA_PROVIDER_KEY} from "@src/providers/data/DataProvider";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {MotivationsService} from "../MotivationsService";
import {userMotivations$, clearMotivations} from "@src/models/UserMotivation";
import {user$} from "@src/models/SessionModel";
import {userAssessments$} from "@src/models/UserAssessment";
import { DataService } from "../DataService";
import { LlmService } from "../LlmService";
import { GenerateDataService } from "../GenerateDataService";
import { createMockUser } from "@src/utils/testing/ProfessionalDevelopmentTestHelper";
import { createMotivationsLlmResponse } from "@src/utils/testing/MotivationsTestHelper";
import { ModelChangeType } from "@src/models/ModelChangeEvent";

describe('MotivationsService', () => {
    let motivationsService: MotivationsService;
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;
    let mockUserId: string;

    const mockUser = {
        id: 'test-user-id',
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
        // Clear existing data
        clearMotivations();
        userMotivations$.set({});

        // Setup test providers
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();

        // Register providers
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Create and initialize services
        const dataService = new DataService();
        await dataService.initialize();
        
        const llmService = new LlmService();
        await llmService.initialize();
        
        const generateDataService = new GenerateDataService();
        await generateDataService.initialize();
        
        // Mock DependencyService.resolve to return our initialized services
        jest.spyOn(DependencyService, 'resolve').mockImplementation((token) => {
            if (token === DataService) return dataService;
            if (token === LlmService) return llmService;
            if (token === GenerateDataService) return generateDataService;
            if (token === DATA_PROVIDER_KEY) return testDataProvider;
            if (token === LLM_PROVIDER_KEY) return testLlmProvider;
            return null;
        });

        // Create and initialize the motivations service
        motivationsService = new MotivationsService();
        await motivationsService.initialize();

        // Create mock user
        const mockUser = createMockUser();
        mockUserId = mockUser.id;
        user$.set(mockUser);
    });

    afterEach(() => {
        testLlmProvider.clearMockResponses();
    });

    it('should initialize successfully', () => {
        expect(motivationsService).toBeDefined();
    });

    it('should create a new motivation', async () => {
        // Test data
        const mockMotivation = {
            title: 'Personal Growth',
            description: 'Driven by continuous learning.'
        };

        // Execute
        const result = await motivationsService.createMotivation(mockMotivation);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.title).toBe(mockMotivation.title);
            expect(result.value.description).toBe(mockMotivation.description);
            // Don't check the exact user ID, just that it exists
            expect(result.value.user_id).toBeTruthy();
        }
    }, 100_000);

    it('should fetch user motivations', async () => {
        // Setup test data
        const mockMotivations = [
            {
                id: '1',
                user_id: mockUserId,
                title: 'Achievement',
                description: 'Driven by setting goals',
                motivation_type: 'SYSTEM_GENERATED',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        
        await testDataProvider.upsertData('user_motivations', mockMotivations);
        
        // Execute
        const result = await motivationsService.fetchUserMotivations(mockUserId);
        
        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.length).toBe(1);
            expect(result.value[0].title).toBe('Achievement');
        }
        
        // Check that observable state was updated
        const stateMotivations = userMotivations$.peek();
        expect(stateMotivations).toBeTruthy();
        expect(Object.keys(stateMotivations!).length).toBe(1);
    });

    it('should update motivation', async () => {
        testDataProvider.clearTestData();
        // Setup
        user$.set(mockUser);
        // let the on change handler run
        await new Promise(resolve => setTimeout(resolve, 500));

        const mockMotivation = {
            title: 'Personal Growth',
            description: 'Driven by continuous learning.'
        };
        const createResult = await motivationsService.createMotivation(mockMotivation);
        expect(createResult.isOk()).toBe(true);
        if (!createResult.isOk()) return;

        const updates = {
            description: 'Updated description'
        };

        // Execute
        const result = await motivationsService.updateMotivation(createResult.value.id, updates);

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.description).toBe(updates.description);
        }
    });

    it('should delete motivation', async () => {
        testDataProvider.clearTestData();
        // Setup
        user$.set(mockUser);
        const mockMotivation = {
            title: 'Personal Growth',
            description: 'Driven by continuous learning.'
        };
        const createResult = await motivationsService.createMotivation(mockMotivation);
        expect(createResult.isOk()).toBe(true);
        if (!createResult.isOk()) return;

        // Execute
        const result = await motivationsService.deleteMotivation(createResult.value.id);

        // Assert
        expect(result.isOk()).toBe(true);
        const motivations = userMotivations$.peek();
        expect(motivations).toEqual({});
    });

    it('should implement MotivationsActionService interface', () => {
        expect(motivationsService.clearMotivations).toBeDefined();
        expect(motivationsService.createMotivation).toBeDefined();
        expect(motivationsService.createMotivations).toBeDefined();
        expect(motivationsService.fetchUserMotivations).toBeDefined();
    });

    it('should register actions with GenerateDataService at initialization', async () => {
        // Create a mock GenerateDataService for this test
        const mockGenerateDataService = {
            registerActions: jest.fn()
        };

        // Create a new instance for this test
        const testService = new MotivationsService();
        
        // @ts-ignore - We're mocking the private field for testing
        testService._generateDataService = mockGenerateDataService;

        // Call initialize
        await testService.initialize();

        // Assert that registerActions was called for each event type
        expect(mockGenerateDataService.registerActions).toHaveBeenCalledWith(
            ModelChangeType.AUTH,
            expect.any(Array)
        );
        
        expect(mockGenerateDataService.registerActions).toHaveBeenCalledWith(
            ModelChangeType.FTUX,
            expect.any(Array)
        );
        
        expect(mockGenerateDataService.registerActions).toHaveBeenCalledWith(
            ModelChangeType.USER_ASSESSMENT,
            expect.any(Array)
        );
    });

    it('should create a single motivation', async () => {
        // Test data
        const testMotivation = {
            title: 'Personal Growth',
            description: 'Driven by continuous learning.'
        };

        // Execute
        const result = await motivationsService.createMotivation(testMotivation);
        
        // Assert
        expect(result.isOk()).toBe(true);
        
        const motivations = userMotivations$.peek();
        expect(motivations).toBeTruthy();
        expect(Object.keys(motivations!).length).toBe(1);
        
        const storedMotivation = Object.values(motivations!)[0];
        expect(storedMotivation.title).toBe(testMotivation.title);
        expect(storedMotivation.description).toBe(testMotivation.description);
    });

    it('should create multiple motivations', async () => {
        // Test data
        const testMotivations = [
            {
                title: 'Achievement',
                description: 'Driven by setting and reaching ambitious goals.'
            },
            {
                title: 'Growth',
                description: 'Energized by continuous learning and self-improvement.'
            }
        ];

        // Execute
        const result = await motivationsService.createMotivations(testMotivations);
        
        // Assert
        expect(result.isOk()).toBe(true);
        
        const motivations = userMotivations$.peek();
        expect(motivations).toBeTruthy();
        expect(Object.keys(motivations!).length).toBe(2);
        
        const titles = Object.values(motivations!).map(m => m.title);
        expect(titles).toContain('Achievement');
        expect(titles).toContain('Growth');
    });

    it('should clear motivations', async () => {
        // Create initial motivations
        await motivationsService.createMotivation({
            title: 'Initial Motivation',
            description: 'Should be cleared'
        });
        
        // Verify initial state
        expect(Object.keys(userMotivations$.peek() || {}).length).toBe(1);
        
        // Execute clear
        const result = await motivationsService.clearMotivations();
        
        // Assert
        expect(result.isOk()).toBe(true);
        expect(userMotivations$.peek() || {}).toEqual({});
    });
}); 