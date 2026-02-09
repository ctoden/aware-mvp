import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { UserCoreValue } from "@src/models/UserCoreValue";
import { ICoreValuesService } from "./ICoreValuesService";

export class FetchCoreValuesAction implements Action<UserCoreValue[]> {
    name = "FetchCoreValuesAction";
    description = "Fetch user core values from the database";

    constructor(private readonly coreValuesService: ICoreValuesService) {}

    async execute<T = UserCoreValue[]>(payload?: any): Promise<Result<T, Error>> {
        // Extract user ID from the session payload
        const userId = payload?.user?.id ?? payload?.id;
        
        if (!userId) {
            console.warn(`~~~ FetchCoreValuesAction: No user ID found in payload`);
            return ok([] as unknown as T);
           // return err(new Error("No user ID found in payload")) as unknown as Result<T, Error>;
        }
        
        // Fetch the user's core values using the injected service
        const result = await this.coreValuesService.fetchUserCoreValues(userId);
        
        if (result.isErr()) {
            return err(result.error) as unknown as Result<T, Error>;
        }
        
        return ok(result.value as unknown as T);
    }
} 