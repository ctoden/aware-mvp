import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { IUserLongTermGoalService } from "./IUserLongTermGoalService";

export class FetchUserLongTermGoalsAction implements Action<boolean> {
    name = "FetchUserLongTermGoalsAction";
    description = "Fetches user long term goals when the user logs in";

    constructor(private longTermGoalService: IUserLongTermGoalService) {}

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        const userId = payload?.user?.id ?? payload?.id;
        if (!userId) {
            console.warn(`~~~ FetchUserLongTermGoalsAction: No user ID found`);
            return ok(true) as Result<T, Error>;
        }

        const result = await this.longTermGoalService.fetchUserLongTermGoals(userId);
        if (result.isErr()) {
            return err(result.error) as Result<T, Error>;
        }

        return ok(true) as Result<T, Error>;
    }
} 