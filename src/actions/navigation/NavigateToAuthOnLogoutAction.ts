import { FTUX_Routes, navigationModel } from "@src/models/NavigationModel";
import { ok, Result } from "neverthrow";
import { Action } from "../Action";

/**
 * Action that navigates to the Auth screen when a user logs out
 */
export class NavigateToAuthOnLogoutAction implements Action<boolean> {
    name = "NavigateToAuthOnLogoutAction";
    description = "Navigates to the Auth screen when a user logs out";

    async execute<T = boolean>(...args: any[]): Promise<Result<T, Error>> {
        try {
            // Navigate to Auth screen
            console.log("~~~ NavigateToAuthOnLogoutAction: Navigating to Auth screen");
            navigationModel.frozenRoute.set(FTUX_Routes.Auth);
            setTimeout(() => {
                navigationModel.frozenRoute.set(null);
            }, 500);
            
            return ok(true as unknown as T);
        } catch (error) {
            console.error("~~~ Error in NavigateToAuthOnLogoutAction: ", error);
            // Even if there's an error, we want to continue the logout process
            // So we'll return success but log the error
            return ok(true as unknown as T);
        }
    }
}