import {DependencyService} from "@src/core/injection/DependencyService";
import {DataService} from "@src/services/DataService";
import {clearProfessionalDevelopment, professionalDevelopment$} from "@src/models/ProfessionalDevelopment";
import {user$} from "@src/models/SessionModel";
import {userAssessments$} from "@src/models/UserAssessment";
import {
    ProfessionalDevelopmentOnUserAssessmentChangeAction
} from "../ProfessionalDevelopmentOnUserAssessmentChangeAction";
import {ProfessionalDevelopmentAuthChangeAction} from "../ProfessionalDevelopmentAuthChangeAction";
import {ProfessionalDevelopmentUserChangeAction} from "../ProfessionalDevelopmentUserChangeAction";
import {ProfessionalDevelopmentService} from "@src/services/ProfessionalDevelopmentService";
import {IProfessionalDevelopmentService} from "../IProfessionalDevelopmentService";
import {createLoveLanguagesAssessment, createStrengthsFinderAssessment} from "@src/utils/testing/AssessmentTestHelper";
import {ChangeType, emitChange} from "@src/events/ChangeEvent";
import {waitForChangeActions} from "@src/utils/testing/FtuxTestHelper";
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import { ok } from "neverthrow";
import {
    createMockAssessment,
    createMockProfessionalDevelopment,
    createMockUser,
    createProfessionalDevelopmentLlmResponse
} from "@src/utils/testing/ProfessionalDevelopmentTestHelper";
import {TestDataProvider} from "@src/providers/data/__tests__/TestDataProvider";
import {DATA_PROVIDER_KEY} from "@src/providers/data/DataProvider";
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";
import {cloneDeep} from "lodash";
import dayjs from "dayjs";
import {LlmService} from "@src/services/LlmService";
import {GenerateDataService} from "@src/services/GenerateDataService";

import { test } from "../../../__tests__/setupIntegrationTest"
import { ftuxState$ } from "@src/models/FtuxModel";
import { completeFtuxFlow } from "@src/utils/testing/FtuxTestHelper";


describe("ProfessionalDevelopmentActions", () => {
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;
    
    const mockUser = createMockUser();
    const mockProfessionalDevelopment = createMockProfessionalDevelopment(mockUser.id);
    const mockAssessments = [createMockAssessment(mockUser.id, "Love Languages", {
        assessment_summary: "Quality Time is the primary love language."
    })];

    beforeEach(async () => {
        // Clear any existing data
        user$.set(null);
        userAssessments$.set([]);
        clearProfessionalDevelopment();
        
        // Reset FTUX state
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.currentStep.set(0);
        
        // Set up test providers
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        testDataProvider.setTestData('user_professional_development', [mockProfessionalDevelopment]);
        
        // Initialize TestLlmProvider
        testLlmProvider = new TestLlmProvider();
        testLlmProvider.clearMockResponses();
        testLlmProvider.setNextResponse(createProfessionalDevelopmentLlmResponse(
            ["Leadership", "Strategic Thinking"],
            "Updated professional development description",
            "Collaborative Leader",
            "A collaborative leader who builds teams",
            "Team Oriented",
            "Sets team-focused goals"
        ));
        
        // Register the test providers
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
        
        // Initialize services in the correct order
        const dataService = DependencyService.resolve(DataService);
        await dataService.initialize();
        
        // Initialize LlmService
        const llmService = DependencyService.resolve(LlmService);
        await llmService.initialize();
        
        // Initialize GenerateDataService before ProfessionalDevelopmentService
        const generateDataService = DependencyService.resolve(GenerateDataService);
        await generateDataService.initialize();
        
        // Initialize ProfessionalDevelopmentService which will register actions with GenerateDataService
        const professionalDevelopmentService = DependencyService.resolve(ProfessionalDevelopmentService);
        await professionalDevelopmentService.initialize();
        
        // Initialize user
        user$.set(mockUser);
    });
    
    afterEach(async () => {
        user$.set(null);
        userAssessments$.set([]);
        clearProfessionalDevelopment();
        
        // Reset FTUX state
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.currentStep.set(0);
        
        // End services in reverse order
        const professionalDevelopmentService = DependencyService.resolve(ProfessionalDevelopmentService);
        await professionalDevelopmentService.end();
        
        const generateDataService = DependencyService.resolve(GenerateDataService);
        await generateDataService.end();
        
        const llmService = DependencyService.resolve(LlmService);
        await llmService.end();
        
        const dataService = DependencyService.resolve(DataService);
        await dataService.end();
        
        await testDataProvider.end();
        testDataProvider.clearTestData();
        
        DependencyService.unregister(DATA_PROVIDER_KEY);
        DependencyService.unregister(LLM_PROVIDER_KEY);
    });
    
    describe("ProfessionalDevelopmentAuthChangeAction", () => {
        it("Should fetch and set professional development when user is authenticated", async () => {
            // Arrange
            const mockService: IProfessionalDevelopmentService = {
                fetchProfessionalDevelopment: jest.fn().mockResolvedValue(ok(mockProfessionalDevelopment)),
                createProfessionalDevelopment: jest.fn(),
                updateProfessionalDevelopment: jest.fn(),
                clearProfessionalDevelopment: jest.fn()
            };
            const action = new ProfessionalDevelopmentAuthChangeAction(mockService);
            
            // Act
            const result = await action.execute(mockUser);
            
            // Assert
            expect(result.isOk()).toBe(true);
            expect(professionalDevelopment$.get()).toEqual(mockProfessionalDevelopment);
            expect(mockService.fetchProfessionalDevelopment).toHaveBeenCalledWith(mockUser.id);
        });

        it("Should clear professional development when user is not authenticated", async () => {
            // Arrange
            professionalDevelopment$.set(mockProfessionalDevelopment);
            const mockService: IProfessionalDevelopmentService = {
                fetchProfessionalDevelopment: jest.fn(),
                createProfessionalDevelopment: jest.fn(),
                updateProfessionalDevelopment: jest.fn(),
                clearProfessionalDevelopment: jest.fn()
            };
            const action = new ProfessionalDevelopmentAuthChangeAction(mockService);
            
            // Act
            const result = await action.execute(null);
            
            // Assert
            expect(result.isOk()).toBe(true);
            expect(professionalDevelopment$.get()).toBeNull();
        });
    });
    
    describe("ProfessionalDevelopmentUserChangeAction", () => {
        it("Should fetch and set professional development when user changes", async () => {
            // Arrange
            const mockService: IProfessionalDevelopmentService = {
                fetchProfessionalDevelopment: jest.fn().mockResolvedValue(ok(mockProfessionalDevelopment)),
                createProfessionalDevelopment: jest.fn(),
                updateProfessionalDevelopment: jest.fn(),
                clearProfessionalDevelopment: jest.fn()
            };
            const action = new ProfessionalDevelopmentUserChangeAction(mockService);
            const change = { value: mockUser };
            
            // Act
            const result = await action.execute(change);
            
            // Assert
            expect(result.isOk()).toBe(true);
            expect(professionalDevelopment$.get()).toEqual(mockProfessionalDevelopment);
            expect(mockService.fetchProfessionalDevelopment).toHaveBeenCalledWith(mockUser.id);
        });

        it("Should clear professional development when user is null", async () => {
            // Arrange
            professionalDevelopment$.set(mockProfessionalDevelopment);
            const mockService: IProfessionalDevelopmentService = {
                fetchProfessionalDevelopment: jest.fn(),
                createProfessionalDevelopment: jest.fn(),
                updateProfessionalDevelopment: jest.fn(),
                clearProfessionalDevelopment: jest.fn()
            };
            const action = new ProfessionalDevelopmentUserChangeAction(mockService);
            const change = { value: null };
            
            // Act
            const result = await action.execute(change);
            
            // Assert
            expect(result.isOk()).toBe(true);
            expect(professionalDevelopment$.get()).toBeNull();
        });
    });
    
    describe("ProfessionalDevelopmentOnUserAssessmentChangeAction", () => {
        it("Should update professional development when assessments change", async () => {
            // Complete FTUX flow first
            ftuxState$.hasCompletedFTUX.set(true);
            ftuxState$.hasCompletedIntro.set(true);
            
            // Arrange
            const initialProfDev = cloneDeep(mockProfessionalDevelopment);
            professionalDevelopment$.set(initialProfDev);

            const newAssessments = cloneDeep(mockAssessments);

            newAssessments.forEach(assessment => {
                assessment.updated_at = dayjs().add(24, 'hour').toDate().toISOString();
            });
            userAssessments$.set(newAssessments);
            const professionalDevelopmentService = DependencyService.resolve(ProfessionalDevelopmentService);
            
            // Make sure LLM provider is properly set up
            testLlmProvider.clearMockResponses();
            const llmResponse = createProfessionalDevelopmentLlmResponse(
                ["Leadership", "Strategic Thinking", "Problem Solving", "Innovation", "Collaboration"],
                "Updated professional development description",
                "Collaborative Leader",
                "A collaborative leader who builds teams",
                "Team Oriented",
                "Sets team-focused goals"
            );
            testLlmProvider.setNextResponse(llmResponse);
            
            // Create the action directly
            const action = new ProfessionalDevelopmentOnUserAssessmentChangeAction(professionalDevelopmentService);
            
            // Act
            const result = await action.execute(newAssessments);
            
            // Verify that it returns success
            expect(result.isOk()).toBe(true);
            
            // Verify that the professional development was updated
            const updatedProfDev = professionalDevelopment$.get();
            
            // Debug output
            console.log("Initial Description:", initialProfDev.description);
            console.log("Updated Description:", updatedProfDev?.description);
            console.log("LLM Response:", JSON.parse(llmResponse).description);
            
            // Assert
            expect(updatedProfDev).not.toBeNull();
            
            // Only access properties if updatedProfDev is not null
            if (updatedProfDev) {
                expect(updatedProfDev.description).toBe("Updated professional development description");
                expect(updatedProfDev.description).not.toBe(initialProfDev.description);
            }
        });

        it("Should update professional development when assessments are updated", async () => {
            // Complete FTUX flow first
            ftuxState$.hasCompletedFTUX.set(true);
            ftuxState$.hasCompletedIntro.set(true);
            
            // Arrange
            const initialProfDev = cloneDeep(mockProfessionalDevelopment);
            professionalDevelopment$.set(initialProfDev);
            
            const newAssessments = cloneDeep(mockAssessments);

            newAssessments.forEach(assessment => {
                assessment.updated_at = dayjs().add(24, 'hour').toDate().toISOString();
            });
            userAssessments$.set(newAssessments);
            const professionalDevelopmentService = DependencyService.resolve(ProfessionalDevelopmentService);
            
            // Clear and set up new response
            testLlmProvider.clearMockResponses();
            testLlmProvider.setNextResponse(createProfessionalDevelopmentLlmResponse(
                ["Leadership", "Strategic Thinking", "Problem Solving", "Innovation", "Collaboration"],
                "Updated professional development description",
                "Collaborative Leader",
                "A collaborative leader who builds teams",
                "Team Oriented",
                "Sets team-focused goals"
            ));

            const action = new ProfessionalDevelopmentOnUserAssessmentChangeAction(professionalDevelopmentService);
            
            // Act
            const result = await action.execute(newAssessments);
            
            // Assert
            expect(result.isOk()).toBe(true);
            const updatedProfDev = professionalDevelopment$.get();
            expect(updatedProfDev).not.toBeNull();
            
            // Only access properties if updatedProfDev is not null
            if (updatedProfDev) {
                expect(updatedProfDev.description).toBe("Updated professional development description");
                expect(updatedProfDev.description).not.toBe(initialProfDev.description);
            }
        });
    });
    
    describe("Integration with GenerateDataService", () => {
        test("When a user adds a Love Languages assessment, the professional development should update", async () => {
            // Complete FTUX flow first
            await completeFtuxFlow(mockUser.id);
            
            // Verify FTUX completion
            expect(ftuxState$.hasCompletedFTUX.get()).toBe(true);
            expect(ftuxState$.hasCompletedIntro.get()).toBe(true);
            
            // Ensure GenerateDataService is properly initialized
            const generateDataService = DependencyService.resolve(GenerateDataService);
            expect(generateDataService).not.toBeNull();
            
            // Verify registered actions for USER_ASSESSMENT
            const registeredActions = generateDataService.getActions(ChangeType.USER_ASSESSMENT);
            expect(registeredActions.length).toBeGreaterThan(0);
            expect(registeredActions.some(action => action.name.includes('ProfessionalDevelopment'))).toBe(true);
            
            // Arrange - Set up initial state
            const initialProfDev = cloneDeep(mockProfessionalDevelopment);
            professionalDevelopment$.set(initialProfDev);
            
            testLlmProvider.clearMockResponses();
            testLlmProvider.setNextResponse(createProfessionalDevelopmentLlmResponse(
                ["Quality Time", "Empathy", "Active Listening", "Compassion", "Emotional Intelligence"],
                "This person values quality time and is empathetic.",
                "Empathetic Leader",
                "Leads with understanding and compassion",
                "Relationship-focused",
                "Sets goals that strengthen relationships"
            ));
            
            // Act - Create a Love Languages assessment and wait for model change actions
            const assessment = await createLoveLanguagesAssessment(mockUser.id, 'Quality Time', true, false);
            console.log(`Created assessment with ID: ${assessment.id}`);
            
            // Wait for model change actions to complete
            await waitForChangeActions(ChangeType.USER_ASSESSMENT, 15000);
            
            // Assert - Professional development should be updated
            expect(professionalDevelopment$.description.get()).toBe("This person values quality time and is empathetic.");
            expect(professionalDevelopment$.leadership_style_title.get()).toBe("Empathetic Leader");
            expect(professionalDevelopment$.description.get()).not.toBe(initialProfDev.description);
        });
        
        test("When a user adds multiple assessments, the professional development should reflect all insights", async () => {
            // Complete FTUX flow first
            await completeFtuxFlow(mockUser.id);
            
            // Ensure GenerateDataService is properly initialized
            const generateDataService = DependencyService.resolve(GenerateDataService);
            expect(generateDataService).not.toBeNull();
            
            // Arrange
            const initialProfDev = cloneDeep(mockProfessionalDevelopment);
            professionalDevelopment$.set(initialProfDev);
            
            // First update - Love Languages
            testLlmProvider.clearMockResponses();
            testLlmProvider.setNextResponse(createProfessionalDevelopmentLlmResponse(
                ["Quality Time", "Empathy", "Active Listening", "Compassion", "Emotional Intelligence"],
                "This person values quality time and is empathetic.",
                "Empathetic Leader",
                "Leads with understanding and compassion",
                "Relationship-focused",
                "Sets goals that strengthen relationships"
            ));
            
            await createLoveLanguagesAssessment(mockUser.id, 'Quality Time', true, false);
            await waitForChangeActions(ChangeType.USER_ASSESSMENT, 15000);
            
            // Verify first update
            expect(professionalDevelopment$.description.get()).toBe("This person values quality time and is empathetic.");
            
            // Second update - StrengthsFinder
            testLlmProvider.clearMockResponses();
            testLlmProvider.setNextResponse(createProfessionalDevelopmentLlmResponse(
                ["Strategic", "Analytical", "Achiever", "Learner", "Adaptability"],
                "This person is strategic, analytical, and achievement-oriented.",
                "Strategic Leader",
                "Leads with analytical thinking and strategy",
                "Achievement-focused",
                "Sets challenging goals focused on achievement"
            ));
            
            await createStrengthsFinderAssessment(mockUser.id, ['Strategic', 'Analytical', 'Achiever'], true, false);
            await waitForChangeActions(ChangeType.USER_ASSESSMENT, 15000);
            
            // Assert final state
            expect(professionalDevelopment$.description.get()).toBe("This person is strategic, analytical, and achievement-oriented.");
            expect(professionalDevelopment$.leadership_style_title.get()).toBe("Strategic Leader");
            expect(professionalDevelopment$.key_terms.get()).toContain("Strategic");
            expect(professionalDevelopment$.key_terms.get()).toContain("Analytical");
        });
    });
}); 