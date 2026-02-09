import { ftuxState$ } from "@src/models/FtuxModel";
import { isNil } from "lodash";
import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";

export class FtuxIntroCompletionProfileUpdateAction implements Action<boolean> {
    name = "FtuxIntroCompletionProfileUpdateAction";
    description = "Updates the profile when FTUX intro is completed";

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        try {
            // Check if FTUX intro is completed
            if (!payload || isNil(payload.hasCompletedIntro)) {
                // Not a FTUX intro completion event, skip
                return ok(true as unknown as T);
            }
            ftuxState$.hasCompletedIntro.set(payload.hasCompletedIntro);
            
            return ok(true as unknown as T);
        } catch (error) {
            console.error("~~~ Error in FtuxIntroCompletionProfileUpdateAction: ", error);
            return err(error instanceof Error ? error : new Error("Unknown error in FtuxIntroCompletionProfileUpdateAction")) as unknown as Result<T, Error>;
        }
    }
} 