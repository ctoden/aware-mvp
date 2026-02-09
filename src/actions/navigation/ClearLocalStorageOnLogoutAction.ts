import { ok, Result } from "neverthrow";
import { Action } from "../Action";
import { LocalStorageService } from "@src/services/LocalStorageService";
import { DependencyService } from "@src/core/injection/DependencyService";

/**
 * Action that clears local storage when a user logs out
 * This ensures that no user-specific data remains in local storage after logout
 */
export class ClearLocalStorageOnLogoutAction implements Action<boolean> {
    name = "ClearLocalStorageOnLogoutAction";
    description = "Clears all local storage data when a user logs out";

    async execute<T = boolean>(...args: any[]): Promise<Result<T, Error>> {
        try {
            // Get the local storage service
            const localStorageService = DependencyService.resolve(LocalStorageService);
            
            // Clear all local storage data
            console.log("~~~ ClearLocalStorageOnLogoutAction: Clearing local storage");
            const result = await localStorageService.clear();
            
            if (result.isErr()) {
                console.error("~~~ Error clearing local storage:", result.error);
                // Even if there's an error, we want to continue the logout process
                // So we'll return success but log the error
            } else {
                console.log("~~~ Local storage cleared successfully");
            }
            
            return ok(true as unknown as T);
        } catch (error) {
            console.error("~~~ Error in ClearLocalStorageOnLogoutAction: ", error);
            // Even if there's an error, we want to continue the logout process
            // So we'll return success but log the error
            return ok(true as unknown as T);
        }
    }
}