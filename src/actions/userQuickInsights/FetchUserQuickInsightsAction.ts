import { err, ok, Result } from "neverthrow";
import { Action } from "@src/actions/Action";
import { IUserQuickInsightService } from "./IUserQuickInsightService";

export class FetchUserQuickInsightsAction implements Action<boolean> {
    name = "FetchUserQuickInsightsAction";
    description = "Fetches user quick insights when the user logs in";

    constructor(private quickInsightService: IUserQuickInsightService) {}

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        const userId = payload?.user?.id ?? payload?.id;
        if (!userId) {
            console.warn(`~~~ FetchUserQuickInsightsAction: No user ID found`);
            return ok(true) as Result<T, Error>;
        }

        const result = await this.quickInsightService.fetchUserInsights();
        if (result.isErr()) {
            console.warn(`~~~ FetchUserQuickInsightsAction: Error fetching user quick insights`, result.error);
        }

        return ok(true as unknown as T);
    }
}