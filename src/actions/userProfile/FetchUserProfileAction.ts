import { DependencyService } from "@src/core/injection/DependencyService";
import { userProfile$ } from "@src/models/UserProfile";
import { AuthService } from "@src/services/AuthService";
import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { ChangeEvent } from "@src/events/ChangeEvent";
import { USER_PROFILE_ACTION_SERVICE_DI_KEY, UserProfileActionService } from "./UserProfileActionService.interface";

export class FetchUserProfileAction implements Action<boolean> {
    name = "FetchUserProfileAction";
    description = "Fetches the user profile when auth state changes and user is authorized";

    private readonly _userProfileService: UserProfileActionService;
    private readonly _authService: AuthService;

    constructor() {
        this._userProfileService = DependencyService.resolve(USER_PROFILE_ACTION_SERVICE_DI_KEY);
        this._authService = DependencyService.resolve(AuthService);
    }

    async execute<T = boolean>(event?: ChangeEvent): Promise<Result<T, Error>> {
        try {
            // Check if user is authenticated
            const isAuthenticated = await this._authService.isAuthenticated();
            
            if (isAuthenticated) {
                // Get the current user session
                const sessionResult = await this._authService.getSession();
                
                if (sessionResult.isErr()) {
                    console.log("~~~ FetchUserProfileAction: Error getting session, skipping profile fetch");
                    return ok(false as unknown as T);
                }
                
                if (!sessionResult.value || !sessionResult.value.user || !sessionResult.value.user.id) {
                    console.log("~~~ FetchUserProfileAction: No valid user in session, skipping profile fetch");
                    userProfile$.set(null);
                    return ok(false as unknown as T);
                }
                
                // Fetch the profile for the user
                const userId = sessionResult.value.user.id;
                const result = await this._userProfileService.fetchProfile(userId);
                
                if (result.isOk()) {
                    // Update the profile in the state
                    userProfile$.set(result.value);
                    return ok(true as unknown as T);
                } else {
                    console.error("~~~ Error fetching profile: ", result.error);
                    return err(result.error) as unknown as Result<T, Error>;
                }
            } else {
                // Clear the profile if user is not authenticated
                userProfile$.set(null);
                return ok(true as unknown as T);
            }
        } catch (error) {
            console.error("~~~ Error in FetchUserProfileAction: ", error);
            return err(error instanceof Error ? error : new Error("Unknown error in FetchUserProfileAction")) as unknown as Result<T, Error>;
        }
    }
} 