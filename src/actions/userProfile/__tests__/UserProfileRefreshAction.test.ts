import { UserProfileRefreshAction } from "../UserProfileRefreshAction";
import { Result, ok, err } from "neverthrow";
import { DependencyService } from "@src/core/injection/DependencyService";
import { UserProfileActionService, USER_PROFILE_ACTION_SERVICE_DI_KEY } from "../UserProfileActionService.interface";

describe("UserProfileRefreshAction", () => {
    let userProfileRefreshAction: UserProfileRefreshAction;
    
    // Create a TestUserProfileActionService that implements the interface
    class TestUserProfileActionService implements UserProfileActionService {
        checkAndRefreshProfileCalled = false;
        
        async checkAndRefreshProfile(): Promise<Result<boolean, Error>> {
            this.checkAndRefreshProfileCalled = true;
            return ok(true);
        }
        
        // Implement other required methods from the interface
        async fetchProfile(): Promise<Result<any, Error>> {
            return ok(null);
        }
        
        async updateProfileSummary(): Promise<Result<boolean, Error>> {
            return ok(true);
        }
    }
    
    let testUserProfileService: TestUserProfileActionService;
    
    beforeEach(() => {
        // Create a new instance of the action for each test
        userProfileRefreshAction = new UserProfileRefreshAction();
        
        // Create test service
        testUserProfileService = new TestUserProfileActionService();
        
        // Register the test service with the DI container
        DependencyService.registerValue(USER_PROFILE_ACTION_SERVICE_DI_KEY, testUserProfileService);
    });
    
    afterEach(() => {
        // Unregister the test service
        DependencyService.unregister(USER_PROFILE_ACTION_SERVICE_DI_KEY);
    });
    
    it("should call checkAndRefreshProfile on UserProfileActionService", async () => {
        // Execute the action
        const result = await userProfileRefreshAction.execute();
        
        // Verify that the action was successful
        expect(result.isOk()).toBe(true);
        
        // Verify that checkAndRefreshProfile was called
        expect(testUserProfileService.checkAndRefreshProfileCalled).toBe(true);
    });
}); 