import {UserAssessment} from "@src/models/UserAssessment";
import {ILlmProvider} from "@src/providers/llm/LlmProvider";
import {IUserRelationshipsService} from "@src/services/UserRelationshipsService";
import {err, ok, Result} from "neverthrow";
import {AssessmentBasedAction} from "../AssessmentBasedAction";
import {CreateRelationshipsAction} from "./CreateRelationshipsAction";
import {ftuxState$} from "@src/models/FtuxModel";
import {userRelationships$} from "@src/models/UserRelationship";

export class RelationshipsOnUserAssessmentChangeAction extends AssessmentBasedAction<boolean> {
    name = "RelationshipsOnUserAssessmentChangeAction";
    description = "Create or update user relationships based on assessment changes";
    private createRelationshipsAction: CreateRelationshipsAction;

    constructor(private relationshipsService: IUserRelationshipsService, private llmProvider?: ILlmProvider) {
        super();
        if (!this.llmProvider) {
            throw new Error("No LLM provider registered");
        }
        this.createRelationshipsAction = new CreateRelationshipsAction(this.llmProvider);
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        // Check if FTUX is completed
        if (!ftuxState$.peek().hasCompletedFTUX) {
            return ok(true);
        }

        if (!this.llmProvider) {
            return err(new Error("No LLM provider registered"));
        }

        try {
            // Store old relationships in memory
            const oldRelationships = { ...userRelationships$.peek() };

            // Clear existing relationships
            const clearResult = await this.relationshipsService.clearUserRelationships();
            if (clearResult.isErr()) {
                return err(clearResult.error);
            }

            // Generate new relationships
            const result = await this.createRelationshipsAction.execute();
            if (result.isErr()) {
                // Restore old relationships if generation fails
                userRelationships$.set(oldRelationships);
                return err(result.error);
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
                // Restore old relationships if creation fails
                userRelationships$.set(oldRelationships);
                return err(createResult.error);
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
} 