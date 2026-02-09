import { err, ok } from "neverthrow";
import { GenerateAndSaveProfessionalDevelopmentAction } from "../GenerateAndSaveProfessionalDevelopmentAction";
import { user$ } from "@src/models/SessionModel";
import { IProfessionalDevelopmentService } from "../IProfessionalDevelopmentService";
import { ILlmProvider } from "@src/providers/llm/LlmProvider";
import { ProfessionalDevelopment } from "@src/models/ProfessionalDevelopment";
import { CreateProfessionalDevelopmentAction } from "../CreateProfessionalDevelopmentAction";

// Mock dependencies
jest.mock("../CreateProfessionalDevelopmentAction");

describe("GenerateAndSaveProfessionalDevelopmentAction", () => {
    let action: GenerateAndSaveProfessionalDevelopmentAction;
    let mockLlmProvider: ILlmProvider;
    let mockProfessionalDevelopmentService: IProfessionalDevelopmentService;
    let mockUser = { id: "test-user-id" };
    
    const mockProfDevResponse = {
        key_terms: ["leadership", "communication"],
        description: "Test description",
        leadership_style_title: "Collaborative Leader",
        leadership_style_description: "Works well with teams",
        goal_setting_style_title: "Strategic Planner",
        goal_setting_style_description: "Sets clear objectives"
    };

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Setup mock LLM provider
        mockLlmProvider = {
            generateText: jest.fn().mockResolvedValue(ok("mock response")),
            generateChat: jest.fn().mockResolvedValue(ok("mock chat response"))
        } as unknown as ILlmProvider;
        
        // Setup mock professional development service
        mockProfessionalDevelopmentService = {
            createProfessionalDevelopment: jest.fn().mockResolvedValue(ok({
                ...mockProfDevResponse,
                id: "test-prof-dev-id",
                user_id: mockUser.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as ProfessionalDevelopment)),
            clearProfessionalDevelopment: jest.fn().mockResolvedValue(ok(true))
        } as unknown as IProfessionalDevelopmentService;
        
        // Mock CreateProfessionalDevelopmentAction
        (CreateProfessionalDevelopmentAction.prototype.execute as jest.Mock).mockResolvedValue(
            ok(mockProfDevResponse)
        );
        
        // Create the action
        action = new GenerateAndSaveProfessionalDevelopmentAction(
            mockLlmProvider,
            mockProfessionalDevelopmentService
        );
        
        // Set mock user
        user$.set(mockUser as any);
    });
    
    afterEach(() => {
        // Clean up
        user$.set(null);
    });

    it("should generate and save professional development successfully", async () => {
        // Execute the action
        const result = await action.execute("test context");
        
        // Verify the result
        expect(result.isOk()).toBe(true);
        
        // Verify CreateProfessionalDevelopmentAction was called
        expect(CreateProfessionalDevelopmentAction.prototype.execute).toHaveBeenCalledWith("test context");
        
        // Verify createProfessionalDevelopment was called with the correct data
        expect(mockProfessionalDevelopmentService.createProfessionalDevelopment).toHaveBeenCalledWith({
            ...mockProfDevResponse,
            user_id: mockUser.id
        });
    });

    it("should return error when no user is found", async () => {
        // Clear the user
        user$.set(null);
        
        // Execute the action
        const result = await action.execute("test context");
        
        // Verify the result
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr().message).toBe("No user found");
        
        // Verify createProfessionalDevelopment was not called
        expect(mockProfessionalDevelopmentService.createProfessionalDevelopment).not.toHaveBeenCalled();
    });

    it("should return error when CreateProfessionalDevelopmentAction fails", async () => {
        // Mock CreateProfessionalDevelopmentAction to fail
        const mockError = new Error("LLM generation failed");
        (CreateProfessionalDevelopmentAction.prototype.execute as jest.Mock).mockResolvedValue(
            err(mockError)
        );
        
        // Execute the action
        const result = await action.execute("test context");
        
        // Verify the result
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBe(mockError);
        
        // Verify createProfessionalDevelopment was not called
        expect(mockProfessionalDevelopmentService.createProfessionalDevelopment).not.toHaveBeenCalled();
    });

    it("should return error when createProfessionalDevelopment fails", async () => {
        // Mock createProfessionalDevelopment to fail
        const mockError = new Error("Database error");
        (mockProfessionalDevelopmentService.createProfessionalDevelopment as jest.Mock).mockResolvedValue(
            err(mockError)
        );
        
        // Execute the action
        const result = await action.execute("test context");
        
        // Verify the result
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBe(mockError);
    });
}); 