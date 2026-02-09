import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { IAboutYouService } from "./IAboutYouService";

export class FetchAboutYouAction implements Action<boolean> {
    name = "FetchAboutYouAction";
    description = "Fetches user about you data when the user logs in";

    constructor(private aboutYouService: IAboutYouService) {}

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        const userId = payload?.user?.id ?? payload?.id;
        if (!userId) {
            console.warn(`~~~ FetchAboutYouAction: No user ID found`);
            return ok(true) as Result<T, Error>;
        }

        const result = await this.aboutYouService.fetchAboutYouEntries();
        if (result.isErr()) {
            console.warn(`~~~ FetchAboutYouAction: Failed to fetch about you data: ${result.error.message}`);
        }

        if (result.isOk()) {
            console.log("~~~ FetchAboutYouAction: result", result.value);
        }

        return ok(true) as Result<T, Error>;
    }
} 