import { DependencyService } from "@src/core/injection/DependencyService";
import { userProfile$ } from "@src/models/UserProfile";
import { UserProfileService } from "@src/services/UserProfileService";
import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";

export class AuthProfileFetchAction implements Action<boolean> {
    name = "AuthProfileFetchAction";
    description = "Fetches the user profile when auth state changes";

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        try {
            // Get the UserProfileService
            const userProfileService = DependencyService.resolve(UserProfileService);
            
            // Check if we have a user in the payload
            const id = payload?.id ?? payload?.user?.id;
            
            if (id) {
                // Fetch the profile for the user
                const result = await userProfileService.fetchProfile(id);
                
                if (result.isOk()) {
                    // Update the profile in the state
                    userProfile$.set(result.value);
                    

                    
                    return ok(true as unknown as T);
                } else {
                    console.error("~~~ Error fetching profile: ", result.error);
                    return err(result.error) as unknown as Result<T, Error>;
                }
            } else {
                // Clear the profile if no user
                userProfile$.set(null);
                return ok(true as unknown as T);
            }
        } catch (error) {
            console.error("~~~ Error in AuthProfileFetchAction: ", error);
            return err(error instanceof Error ? error : new Error("Unknown error in AuthProfileFetchAction")) as unknown as Result<T, Error>;
        }
    }
} 