import { err, ok, Result } from "neverthrow";
import { Action } from "@src/actions/Action";
import { WeaknessesActionService } from "./WeaknessesActionService.interface";

export class FetchWeaknessesAction implements Action<boolean> {
    name = "FetchWeaknessesAction";
    description = "Fetches user weaknesses when the user logs in";

    constructor(private weaknessesService: WeaknessesActionService) {}

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        const userId = payload?.user?.id || payload?.id;
        if (!userId) {
            // Don't throw an error when there's no session - just return success
            return ok(true) as Result<T, Error>;
        }

        const result = await this.weaknessesService.fetchUserWeaknesses(userId);
        if (result.isErr()) {
            return err(result.error) as Result<T, Error>;
        }

        return ok(true) as Result<T, Error>;
    }
} 