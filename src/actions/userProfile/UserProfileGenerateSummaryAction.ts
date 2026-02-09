import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { DependencyService } from "@src/core/injection/DependencyService";
import { UserProfileActionService, USER_PROFILE_ACTION_SERVICE_DI_KEY } from "./UserProfileActionService.interface";
import { cloneDeep } from "lodash";
import { userAssessments$ } from "@src/models/UserAssessment";

/**
 * Action that triggers profile summary generation when a USER_PROFILE_GENERATE_SUMMARY event occurs
 */
export class UserProfileGenerateSummaryAction implements Action<boolean> {
    name = "UserProfileGenerateSummaryAction";
    description = "Generates a user profile summary directly without triggering the LLM service if no assessments exist";

    async execute<T = boolean>(_payload?: any): Promise<Result<T, Error>> {
        try {
            console.log("~~~ UserProfileGenerateSummaryAction: Generating profile summary");
            
            // Get the UserProfileActionService using the interface DI key
            const userProfileService = DependencyService.resolve<UserProfileActionService>(USER_PROFILE_ACTION_SERVICE_DI_KEY);
            
            // Get current assessments and clone them
            const currentAssessments = cloneDeep(userAssessments$.peek() ?? []);
            
            // Force assessment dates to be in the future
            currentAssessments.forEach(assessment => {
                assessment.updated_at = new Date(new Date().setDate(new Date().getDate() + 1)).toISOString();
            });
            
            // Update profile summary directly
            const result = await userProfileService.updateProfileSummary(currentAssessments);
            
            if (result.isErr()) {
                console.warn("~~~ Error generating profile summary:", result.error);
                return err(result.error) as unknown as Result<T, Error>;
            }

            // Set the refresh profile timestamp to now after successful summary generation
            const timestampResult = await userProfileService.setRefreshProfileTimestamp();
            if (timestampResult.isErr()) {
                console.warn("~~~ Warning: Failed to update refresh profile timestamp:", timestampResult.error);
                // Continue despite the timestamp update failure
            }
            
            return ok(result.value as unknown as T);
        } catch (error) {
            console.error("~~~ Error in UserProfileGenerateSummaryAction: ", error);
            return err(error instanceof Error ? error : new Error("Unknown error in UserProfileGenerateSummaryAction")) as unknown as Result<T, Error>;
        }
    }
} 