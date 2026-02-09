import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { DependencyService } from "@src/core/injection/DependencyService";
import { UserProfileActionService, USER_PROFILE_ACTION_SERVICE_DI_KEY } from "./UserProfileActionService.interface";
import { user$ } from "@src/models/SessionModel";

/**
 * Action that triggers a profile refresh when a USER_PROFILE_REFRESH event occurs
 */
export class UserProfileRefreshAction implements Action<boolean> {
    name = "UserProfileRefreshAction";
    description = "Refreshes the user profile when USER_PROFILE_REFRESH event is triggered";

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        try {
            console.log("~~~ UserProfileRefreshAction: Triggering profile refresh");
            
            // Get the UserProfileActionService using the interface DI key
            const userProfileService = DependencyService.resolve<UserProfileActionService>(USER_PROFILE_ACTION_SERVICE_DI_KEY);
            
            // Check if this is a force refresh request
            const forceRefresh = payload?.forceRefresh === true;
            
            // Get current user ID
            const userId = user$.peek()?.id;
            if (!userId) {
                console.log("~~~ UserProfileRefreshAction: No user ID available");
                return ok(true as unknown as T);
            }
            
            // Call service with forceRefresh flag
            const result = await userProfileService.checkAndRefreshProfile(forceRefresh);
            
            if (result.isErr()) {
                console.error("~~~ Error refreshing profile:", result.error);
                return err(result.error) as unknown as Result<T, Error>;
            }
            
            return ok(result.value as unknown as T);
        } catch (error) {
            console.error("~~~ Error in UserProfileRefreshAction: ", error);
            return err(error instanceof Error ? error : new Error("Unknown error in UserProfileRefreshAction")) as unknown as Result<T, Error>;
        }
    }
} 