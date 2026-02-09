import { UserProfileGenerateSummaryAction } from "../UserProfileGenerateSummaryAction";
import { Result, ok, err } from "neverthrow";
import { DependencyService } from "@src/core/injection/DependencyService";
import { UserProfileActionService, USER_PROFILE_ACTION_SERVICE_DI_KEY } from "../UserProfileActionService.interface";
import { userAssessments$ } from "@src/models/UserAssessment";

describe("UserProfileGenerateSummaryAction", () => {
    let userProfileGenerateSummaryAction: UserProfileGenerateSummaryAction;
    
    // Create a TestUserProfileActionService that implements the interface
    class TestUserProfileActionService implements UserProfileActionService {
        updateProfileSummaryCalled = false;
        assessmentsPassedToUpdate: any[] = [];
        
        async updateProfileSummary(assessments: any[]): Promise<Result<boolean, Error>> {
            this.updateProfileSummaryCalled = true;
            this.assessmentsPassedToUpdate = assessments;
            return ok(true);
        }
        
        // Implement other required methods from the interface
        async fetchProfile(): Promise<Result<any, Error>> {
            return ok(null);
        }
        
        async checkAndRefreshProfile(): Promise<Result<boolean, Error>> {
            return ok(true);
        }
    }
    
    let testUserProfileService: TestUserProfileActionService;
    
    beforeEach(() => {
        // Create a new instance of the action for each test
        userProfileGenerateSummaryAction = new UserProfileGenerateSummaryAction();
        
        // Create test service
        testUserProfileService = new TestUserProfileActionService();
        
        // Register the test service with the DI container
        DependencyService.registerValue(USER_PROFILE_ACTION_SERVICE_DI_KEY, testUserProfileService);
        
        // Set up mock assessments
        userAssessments$.set([
            { 
                id: "1", 
                user_id: "test-user-id",
                name: "Test Assessment",
                assessment_type: "Test", 
                assessment_summary: "Summary", 
                assessment_full_text: "Full text",
                created_at: "2023-01-01T00:00:00Z",
                updated_at: "2023-01-01T00:00:00Z"
            }
        ]);
    });
    
    afterEach(() => {
        // Unregister the test service
        DependencyService.unregister(USER_PROFILE_ACTION_SERVICE_DI_KEY);
        
        // Clear assessments
        userAssessments$.set([]);
    });
    
    it("should call updateProfileSummary on UserProfileActionService with modified dates", async () => {
        // Execute the action
        const result = await userProfileGenerateSummaryAction.execute();
        
        // Verify that the action was successful
        expect(result.isOk()).toBe(true);
        
        // Verify that updateProfileSummary was called
        expect(testUserProfileService.updateProfileSummaryCalled).toBe(true);
        
        // Verify that assessments were passed with modified dates
        expect(testUserProfileService.assessmentsPassedToUpdate.length).toBe(1);
        
        // Check that the date was modified to be in the future
        const assessment = testUserProfileService.assessmentsPassedToUpdate[0];
        const updatedDate = new Date(assessment.updated_at);
        const today = new Date();
        expect(updatedDate.getDate()).toBe(today.getDate() + 1);
    });
    
    it("should handle empty assessments", async () => {
        // Set empty assessments
        userAssessments$.set([]);
        
        // Execute the action
        const result = await userProfileGenerateSummaryAction.execute();
        
        // Verify that the action was successful
        expect(result.isOk()).toBe(true);
        
        // Verify that updateProfileSummary was called with empty array
        expect(testUserProfileService.updateProfileSummaryCalled).toBe(true);
        expect(testUserProfileService.assessmentsPassedToUpdate.length).toBe(0);
    });
}); 