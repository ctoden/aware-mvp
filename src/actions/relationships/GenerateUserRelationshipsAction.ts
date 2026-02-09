import { err, ok, Result } from "neverthrow";
import { Action } from "@src/actions/Action";
import { IUserRelationshipsService } from "@src/services/UserRelationshipsService";
import { ILlmProvider } from "@src/providers/llm/LlmProvider";
import { ftuxState$ } from "@src/models/FtuxModel";
import { CreateRelationshipsAction } from "./CreateRelationshipsAction";

export class GenerateUserRelationshipsAction implements Action<boolean> {
    name = "GenerateUserRelationshipsAction";
    description = "Generate user relationships after FTUX completion";

    constructor(
        private relationshipsService: IUserRelationshipsService,
        private llmService: ILlmProvider
    ) {}

    async execute<T = boolean>(): Promise<Result<T, Error>> {
        try {
            // Create relationships using the CreateRelationshipsAction
            const createAction = new CreateRelationshipsAction(this.llmService);
            const result = await createAction.execute();
            if (result.isErr()) {
                return err(result.error) as Result<T, Error>;
            }

            // Clear existing relationships
            const clearResult = await this.relationshipsService.clearUserRelationships();
            if (clearResult.isErr()) {
                return err(clearResult.error) as Result<T, Error>;
            }

            // Create the relationship record
            const createResult = await this.relationshipsService.createUserRelationship({
                user_id: "", // Will be filled by service
                key_terms: result.value.key_terms ?? [],
                description: result.value.description ?? "",
                communication_style_title: result.value.communication_style_title ?? "",
                communication_style_description: result.value.communication_style_description ?? "",
                conflict_style_title: result.value.conflict_style_title ?? "",
                conflict_style_description: result.value.conflict_style_description ?? "",
                attachment_style_title: result.value.attachment_style_title ?? "",
                attachment_style_description: result.value.attachment_style_description ?? ""
            });

            if (createResult.isErr()) {
                return err(createResult.error) as Result<T, Error>;
            }

            return ok(true) as Result<T, Error>;
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error))) as Result<T, Error>;
        }
    }
} 