import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { UserProfileActionService } from "./UserProfileActionService.interface";
import { DependencyService } from "@src/core/injection/DependencyService";

export class FtuxCompletionProfileRefreshAction implements Action<boolean> {
    name = "FtuxCompletionProfileRefreshAction";
    description = "Refreshes the profile when FTUX is completed";

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        try {
            // Check if FTUX is completed
            if (payload?.hasCompletedFTUX !== true) {
                // Not a FTUX completion event, skip
                return ok(true as unknown as T);
            }
            
            console.log("~~~ FTUX completed, triggering full profile refresh");
            
            // Get the UserProfileService
            const userProfileService = DependencyService.resolve<UserProfileActionService>("UserProfileActionService");
            
            // Refresh the profile
            const result = await userProfileService.checkAndRefreshProfile();
            
            if (result.isErr()) {
                console.error("~~~ Error refreshing profile after FTUX completion:", result.error);
                return err(result.error) as unknown as Result<T, Error>;
            }
            
            return ok(true as unknown as T);
        } catch (error) {
            console.error("~~~ Error in FtuxCompletionProfileRefreshAction: ", error);
            return err(error instanceof Error ? error : new Error("Unknown error in FtuxCompletionProfileRefreshAction")) as unknown as Result<T, Error>;
        }
    }
} 
