import { GenerateMotivationsAction } from '../GenerateMotivationsAction';
import { clearMotivations, userMotivations$ } from '@src/models/UserMotivation';
import { TestLlmProvider } from '@src/providers/llm/__tests__/TestLlmProvider';
import { DependencyService } from "@src/core/injection/DependencyService";
import { LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { ftuxState$ } from "@src/models/FtuxModel";
import { TestDataProvider } from "@src/providers/data/__tests__/TestDataProvider";
import { createLoveLanguagesAssessment } from "@src/utils/testing/AssessmentTestHelper";
import { user$ } from "@src/models/SessionModel";
import { userAssessments$ } from "@src/models/UserAssessment";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { DataService } from "@src/services/DataService";
import { LlmService } from "@src/services/LlmService";
import { MotivationsService } from "@src/services/MotivationsService";
import { createMockUser } from "@src/utils/testing/ProfessionalDevelopmentTestHelper";
import { createMotivationsLlmResponse } from "@src/utils/testing/MotivationsTestHelper";

describe('GenerateMotivationsAction', () => {
    let motivationsService: MotivationsService;
    let dataService: DataService;
    let llmService: LlmService;
    let generateMotivationsAction: GenerateMotivationsAction;
    let testLlmProvider: TestLlmProvider;
    let testDataProvider: TestDataProvider;
    let mockUserId: string;
    
    beforeEach(async () => {
        clearMotivations();
        userMotivations$.set({});
        
        // Initialize test providers
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        
        // Register providers with DependencyService
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        
        // Initialize services
        dataService = new DataService();
        await dataService.initialize();
        
        llmService = new LlmService();
        await llmService.initialize();
        
        motivationsService = new MotivationsService();
        await motivationsService.initialize();
        
        // Create mock user
        const mockUser = createMockUser();
        mockUserId = mockUser.id;
        user$.set(mockUser);
        
        // Initialize the action
        generateMotivationsAction = new GenerateMotivationsAction(motivationsService);
        
        // Reset FTUX state
        ftuxState$.set({
            hasCompletedIntro: false,
            hasCompletedFTUX: false,
            currentStep: 0
        });
        
        // Reset assessments
        userAssessments$.set([]);
    });
    
    afterEach(async () => {
        // Clean up services and providers
        await motivationsService.end();
        await llmService.end();
        await dataService.end();
        await testLlmProvider.end();
        await testDataProvider.end();
    });
    
    it('should skip generating motivations if FTUX is not completed', async () => {
        // Execute
        const result = await generateMotivationsAction.execute();
        
        // Assert
        expect(result.isOk()).toBe(true);
        expect(userMotivations$.peek()).toEqual({});
    });
    
    it('should skip generating motivations if no assessments are available', async () => {
        // Setup - Mark FTUX as completed
        ftuxState$.set({
            hasCompletedIntro: true,
            hasCompletedFTUX: true,
            currentStep: 5
        });
        
        // Execute
        const result = await generateMotivationsAction.execute();
        
        // Assert
        expect(result.isOk()).toBe(true);
        expect(userMotivations$.peek()).toEqual({});
    });
    
    it('should generate motivations when FTUX is completed and assessments are available', async () => {
        // Setup - Mark FTUX as completed
        ftuxState$.set({
            hasCompletedIntro: true,
            hasCompletedFTUX: true,
            currentStep: 5
        });
        
        // Add mock assessment
        const mockAssessment = await createLoveLanguagesAssessment(mockUserId);
        userAssessments$.set([mockAssessment]);
        
        // Setup mock LLM response
        const mockMotivations = [
            { title: "Achievement", description: "Driven by setting and reaching ambitious goals" },
            { title: "Growth", description: "Energized by continuous learning and self-improvement" },
            { title: "Connection", description: "Motivated by building meaningful relationships" }
        ];
        testLlmProvider.setNextResponse(createMotivationsLlmResponse(mockMotivations));
        
        // Execute
        const result = await generateMotivationsAction.execute();
        
        // Assert
        expect(result.isOk()).toBe(true);
        
        const motivations = userMotivations$.peek() || {};
        expect(Object.keys(motivations).length).toBe(3);
        
        // Check that motivations match the mock data
        const motivationArray = Object.values(motivations);
        expect(motivationArray.map(m => m.title)).toEqual(expect.arrayContaining(mockMotivations.map(m => m.title)));
        expect(motivationArray.map(m => m.description)).toEqual(expect.arrayContaining(mockMotivations.map(m => m.description)));
    });
    
    it('should handle LLM error when generating motivations', async () => {
        // Setup - Mark FTUX as completed
        ftuxState$.set({
            hasCompletedIntro: true,
            hasCompletedFTUX: true,
            currentStep: 5
        });
        
        // Add mock assessment
        const mockAssessment = await createLoveLanguagesAssessment(mockUserId);
        userAssessments$.set([mockAssessment]);
        
        // Setup mock LLM error response
        // Use a string that will cause an error in the LLM service
        testLlmProvider.setNextResponse("error: Mock LLM error");
        
        // Execute
        const result = await generateMotivationsAction.execute();
        
        // Assert
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBeDefined();
        }
        
        // No motivations should be created
        const currentMotivations = userMotivations$.peek();
        expect(currentMotivations === null || Object.keys(currentMotivations || {}).length === 0).toBe(true);
    });
    
    it('should clear existing motivations before creating new ones', async () => {
        // Setup - Mark FTUX as completed
        ftuxState$.set({
            hasCompletedIntro: true,
            hasCompletedFTUX: true,
            currentStep: 5
        });
        
        // Add mock assessment
        const mockAssessment = await createLoveLanguagesAssessment(mockUserId);
        userAssessments$.set([mockAssessment]);
        
        // Create some initial motivations
        await motivationsService.createMotivation({ 
            title: "Initial Motivation", 
            description: "This should be cleared" 
        });
        
        // Verify initial state
        const initialMotivations = userMotivations$.peek() || {};
        expect(Object.keys(initialMotivations).length).toBe(1);
        
        // Setup mock LLM response with valid motivations
        const mockMotivations = [
            { title: "Achievement", description: "Driven by setting and reaching ambitious goals" },
            { title: "Growth", description: "Energized by continuous learning and self-improvement" },
            { title: "Adventure", description: "Driven by exploring new experiences and challenges" }
        ];
        
        // Use the helper function to create a valid LLM response
        testLlmProvider.setNextResponse(createMotivationsLlmResponse(mockMotivations));

        // TODO: get this working
        // Execute
        const result = await generateMotivationsAction.execute();
        
        // Assert
        expect(result.isOk()).toBe(true);
        
        const motivations = userMotivations$.peek() || {};
        expect(Object.keys(motivations).length).toBe(mockMotivations.length);
        
        // Check that initial motivation was cleared
        const motivationTitles = Object.values(motivations).map(m => m.title);
        expect(motivationTitles).not.toContain("Initial Motivation");
        expect(motivationTitles).toEqual(expect.arrayContaining(mockMotivations.map(m => m.title)));
    });
}); 