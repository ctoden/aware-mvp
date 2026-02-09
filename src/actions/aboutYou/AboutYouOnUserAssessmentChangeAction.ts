import { err, ok, Result } from "neverthrow";
import { DependencyService } from "@src/core/injection/DependencyService";
import { UserAssessment } from "@src/models/UserAssessment";
import { AboutYouSectionType, UserAboutYou, userAboutYou$ } from "@src/models/UserAboutYou";
import { LlmService } from "@src/services/LlmService";
import { AssessmentBasedAction } from "../AssessmentBasedAction";
import { CreateAboutYouAction, AboutYouEntry } from "./CreateAboutYouAction";
import { ftuxState$ } from "@src/models/FtuxModel";
import { IAboutYouService } from "./IAboutYouService";

export class AboutYouOnUserAssessmentChangeAction extends AssessmentBasedAction<boolean> {
    name = "AboutYouOnUserAssessmentChangeAction";
    description = "Create, Read, Update, Delete About You entries based on userAssessments";

    constructor(private aboutYouService: IAboutYouService) {
        super();
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        // Check if FTUX is completed
        if (!ftuxState$.peek().hasCompletedFTUX) {
            return ok(true);
        }

        console.log("~~~~ AboutYouOnUserAssessmentChangeAction: Processing assessments");

        const assessmentContextArray: Array<string> = assessments.map(assessment =>
            assessment.assessment_type + ": " + assessment.assessment_summary
        );
        const context = assessmentContextArray.join("\n");

        const llmService = DependencyService.resolve(LlmService);
        if (!llmService.llmProvider) {
            return err(new Error('LLM provider not initialized'));
        }

        try {
            // Store old entries in memory
            const oldEntries = { ...userAboutYou$.peek() };

            // Clear existing entries
            const clearResult = await this.aboutYouService.clearAboutYouEntries();
            if(clearResult.isErr()) {
                userAboutYou$.set(oldEntries);
                return err(clearResult.error);
            }

            const sections = [
                AboutYouSectionType.SELF_AWARENESS,
                AboutYouSectionType.RELATIONSHIPS,
                AboutYouSectionType.CAREER_DEVELOPMENT
            ];

            // Generate new entries for each section
            for (const sectionType of sections) {
                const createAction = new CreateAboutYouAction(llmService.llmProvider, sectionType);
                const result = await createAction.execute(context);
                if (result.isErr()) {
                    // Restore old entries if generation fails
                    userAboutYou$.set(oldEntries);
                    return err(result.error);
                }

                // Ensure we only take a maximum of 5 entries per section
                const entriesToCreate = result.value.slice(0, 5);
                
                // Create entries for this section
                for (const entry of entriesToCreate) {
                    const createResult = await this.aboutYouService.createAboutYouEntry(entry, sectionType);
                    if (createResult.isErr()) {
                        // Restore old entries if creation fails
                        userAboutYou$.set(oldEntries);
                        return err(createResult.error);
                    }
                }
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
} 