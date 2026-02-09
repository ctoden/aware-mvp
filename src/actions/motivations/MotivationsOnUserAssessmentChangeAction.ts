import { err, ok, Result } from "neverthrow";
import { DependencyService } from "@src/core/injection/DependencyService";
import { UserAssessment } from "@src/models/UserAssessment";
import { MotivationType, UserMotivation } from "@src/models/UserMotivation";
import { IMotivation } from "@src/models/UserMotivation";
import { LlmService } from "@src/services/LlmService";
import { AssessmentBasedAction } from "../AssessmentBasedAction";
import { MotivationsActionService } from "./MotivationsActionService.interface";
import { ftuxState$ } from "@src/models/FtuxModel";

export class MotivationsOnUserAssessmentChangeAction extends AssessmentBasedAction<boolean> {
    name = "MotivationsOnUserAssessmentChangeAction";
    description = "Update motivations based on user assessments";
    
    // Track last processed assessment timestamp to prevent redundant processing
    private lastProcessedTimestamp: string = "";

    constructor(private motivationsService: MotivationsActionService) {
        super();
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        // Only process if FTUX is completed
        if (!ftuxState$.peek().hasCompletedFTUX) {
            console.log("~~~~ MotivationsOnUserAssessmentChangeAction: FTUX not completed, skipping");
            return ok(true);
        }
        
        // Skip if no assessments or no relevant assessments
        if (!assessments || assessments.length === 0) {
            console.log("~~~~ MotivationsOnUserAssessmentChangeAction: No assessments to process");
            return ok(true);
        }
        
        // Find the newest assessment
        const newestAssessment = assessments.reduce((newest, current) => {
            return (newest.updated_at || '') > (current.updated_at || '') ? newest : current;
        }, assessments[0]);
        
        // Check if we've already processed this set of assessments
        if (this.lastProcessedTimestamp === (newestAssessment.updated_at || '')) {
            console.log("~~~~ MotivationsOnUserAssessmentChangeAction: Already processed these assessments, skipping");
            return ok(true);
        }
        
        console.log("~~~~ MotivationsOnUserAssessmentChangeAction: Processing assessments after FTUX completion");

        const assessmentContextArray: Array<string> = assessments.map(assessment =>
            assessment.assessment_type + ": " + assessment.assessment_summary
        );

        try {
            // Update timestamp first to prevent concurrent processing of the same assessments
            this.lastProcessedTimestamp = newestAssessment.updated_at || '';
            
            // Log timestamp to help with debugging
            console.log(`~~~~ MotivationsOnUserAssessmentChangeAction: Processing assessments with timestamp ${this.lastProcessedTimestamp}`);
            
            const llmService = DependencyService.resolve(LlmService);
            const motivationsResults = await llmService.generateMotivations(assessmentContextArray.join("\n"));
            if (motivationsResults.isErr()) {
                console.error("~~~ Error generating motivations: ", motivationsResults.error);
                return err(motivationsResults.error);
            }

            console.log("~~~~ MotivationsOnUserAssessmentChangeAction: Generated motivations:", motivationsResults.value);
            
            // This will perform the database operation first due to the fix in MotivationsService.clearMotivations
            const clearResult = await this.motivationsService.clearMotivations();
            if (clearResult.isErr()) {
                console.error("~~~ Error clearing motivations: ", clearResult.error);
                return err(clearResult.error);
            }
            
            // Create the new motivations
            const createResult = await this.motivationsService.createMotivations(motivationsResults.value);
            if (createResult.isErr()) {
                console.error("~~~ Error creating motivations: ", createResult.error);
                return err(createResult.error);
            }

            console.log("~~~~ MotivationsOnUserAssessmentChangeAction: Successfully updated motivations");
            return ok(true);
        } catch (error) {
            console.error("~~~ Unexpected error in MotivationsOnUserAssessmentChangeAction: ", error);
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
} 