import { err, ok, Result } from "neverthrow";
import { Action } from "@src/actions/Action";
import { IUserQuickInsightService } from "./IUserQuickInsightService";
import { CreateUserQuickInsightAction } from "./CreateUserQuickInsightAction";
import { ILlmProvider } from "@src/providers/llm/LlmProvider";
import { ChangeEvent } from "@src/events/ChangeEvent";

export class GenerateUserQuickInsightAction implements Action<boolean> {
    name = "GenerateUserQuickInsightAction";
    description = "Generates user quick insights during FTUX or when assessments change";

    private readonly _createUserQuickInsightAction: CreateUserQuickInsightAction;

    constructor(
        private readonly quickInsightService: IUserQuickInsightService,
        private readonly llmProvider: ILlmProvider
    ) {
        this._createUserQuickInsightAction = new CreateUserQuickInsightAction(llmProvider);
    }

    async execute<T = boolean>(event?: ChangeEvent): Promise<Result<T, Error>> {
        console.log("~~~~ GenerateUserQuickInsightAction execute", event);
        // Generate insight content using the CreateUserQuickInsightAction
        const insightContentResult = await this._createUserQuickInsightAction.execute();
        if (insightContentResult.isErr()) {
            return err(insightContentResult.error) as Result<T, Error>;
        }

        // If no content was generated, return success
        if (!insightContentResult.value) {
            console.warn("No User Quick Insight content generated");
            return ok(true as unknown as T);
        }

        // First, fetch existing insights
        const existingInsightsResult = await this.quickInsightService.fetchUserInsights();
        if (existingInsightsResult.isErr()) {
            return err(existingInsightsResult.error) as Result<T, Error>;
        }

        // Delete all existing insights
        const existingInsights = existingInsightsResult.value;
        for (const insight of existingInsights) {
            const deleteResult = await this.quickInsightService.deleteInsight(insight.id);
            if (deleteResult.isErr()) {
                console.warn(`Failed to delete insight ${insight.id}: ${deleteResult.error.message}`);
                // Continue with the process even if deletion fails
            }
        }

        // Parse the title and description from the result
        const [title, description] = insightContentResult.value.split('|');
        if (!title || !description) {
            return err(new Error('Invalid insight format returned')) as Result<T, Error>;
        }

        // Create the insight in the database
        const createResult = await this.quickInsightService.createInsight(title, description);
        if (createResult.isErr()) {
            return err(createResult.error) as Result<T, Error>;
        }

        return ok(true as unknown as T);
    }
} 