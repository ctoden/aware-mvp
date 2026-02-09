import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { DependencyService } from "@src/core/injection/DependencyService";
import { MotivationsActionService } from "./MotivationsActionService.interface";

export class FetchMotivationsAction implements Action<boolean> {
    name = "FetchMotivationsAction";
    description = "Fetches user motivations when the user logs in";

    constructor(private motivationsService: MotivationsActionService) {}

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        const userId = payload?.user?.id ?? payload?.id;
        if (!userId) {
            console.warn(`~~~ FetchMotivationsAction: No user ID found`);
            return ok(true) as Result<T, Error>;
        }

        const result = await this.motivationsService.fetchUserMotivations(userId);
        if (result.isErr()) {
            return err(result.error) as Result<T, Error>;
        }
        console.log("~~~ FetchMotivationsAction: result", result.value);

        return ok(true as unknown as T);
    }
} 