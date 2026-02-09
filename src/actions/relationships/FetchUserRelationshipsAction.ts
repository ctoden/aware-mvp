import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { IUserRelationshipsService } from "@src/services/UserRelationshipsService";

export class FetchUserRelationshipsAction implements Action<boolean> {
    name = "FetchUserRelationshipsAction";
    description = "Fetches user relationships when the user logs in";

    constructor(private relationshipsService: IUserRelationshipsService) {}

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        const userId = payload?.user?.id ?? payload?.id;
        if (!userId) {
            console.warn(`~~~ FetchUserRelationshipsAction: No user ID found`);
            return ok(true) as Result<T, Error>;
        }

        const result = await this.relationshipsService.fetchUserRelationships(userId);
        if (result.isErr()) {
            return err(result.error) as Result<T, Error>;
        }

        return ok(true) as Result<T, Error>;
    }
} 