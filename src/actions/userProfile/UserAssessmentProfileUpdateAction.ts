import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { UserAssessment } from "@src/models/UserAssessment";
import { UserProfileService } from "@src/services/UserProfileService";
import { DependencyService } from "@src/core/injection/DependencyService";
import { ftuxState$ } from "@src/models/FtuxModel";

export class UserAssessmentProfileUpdateAction implements Action<boolean> {
    name = "UserAssessmentProfileUpdateAction";
    description = "Updates the user profile summary based on assessment changes";

    async execute<T = boolean>(payload?: any): Promise<Result<T, Error>> {
        try {
            // Get the UserProfileService
            const userProfileService = DependencyService.resolve(UserProfileService);
            
            // Check if we're in FTUX mode
            if (!ftuxState$.hasCompletedIntro.peek()) {
                console.log("~~~ Skipping profile summary update during FTUX");
                return ok(true as unknown as T);
            }
            
            // Extract assessments from payload
            let assessments: UserAssessment[] = [];
            let useAllAssessments = false;
            
            // Handle both array format and object format with metadata
            if (Array.isArray(payload)) {
                assessments = payload;
            } else if (payload && typeof payload === 'object') {
                assessments = payload.assessments || [];
                useAllAssessments = payload.useAllAssessments || false;
            }
            
            // Log special case for FTUX completion
            if (payload && payload.source === 'FTUX_COMPLETION') {
                console.log("~~~ Processing profile summary after FTUX completion");
            }
            
            // Update the profile summary
            const result = await userProfileService.updateProfileSummary(assessments);
            if (result.isErr()) {
                console.error("~~~ Error updating profile summary: ", result.error);
                return err(result.error) as unknown as Result<T, Error>;
            }
            
            return ok(true as unknown as T);
        } catch (error) {
            console.error("~~~ Error in UserAssessmentProfileUpdateAction: ", error);
            return err(error instanceof Error ? error : new Error("Unknown error in UserAssessmentProfileUpdateAction")) as unknown as Result<T, Error>;
        }
    }
} 