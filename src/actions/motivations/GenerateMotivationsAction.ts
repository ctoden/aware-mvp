import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { DependencyService } from "@src/core/injection/DependencyService";
import { LlmService } from "@src/services/LlmService";
import { MotivationsActionService } from "./MotivationsActionService.interface";
import { UserAssessment, userAssessments$ } from "@src/models/UserAssessment";
import { ftuxState$ } from "@src/models/FtuxModel";

export class GenerateMotivationsAction implements Action<boolean> {
    name = "GenerateMotivationsAction";
    description = "Generate motivations after FTUX completion";

    constructor(private motivationsService: MotivationsActionService) {}

    async execute<T = boolean>(): Promise<Result<T, Error>> {
        // Get assessments to generate motivations
        const assessments = userAssessments$.peek();
        if (!assessments || Object.keys(assessments).length === 0) {
            console.log("~~~~ GenerateMotivationsAction: No assessments found, skipping");
            return ok(true as unknown as T);
        }

        const assessmentArray = Object.values(assessments);
        const assessmentContextArray: Array<string> = assessmentArray.map(assessment =>
            assessment.assessment_type + ": " + assessment.assessment_summary
        );

        // Clear existing motivations
        const clearResult = await this.motivationsService.clearMotivations();
        if (clearResult.isErr()) {
            console.error("~~~ Error clearing motivations: ", clearResult.error);
            return err(clearResult.error) as Result<T, Error>;
        }

        // Generate new motivations
        const llmService = DependencyService.resolve(LlmService);
        const motivationsResults = await llmService.generateMotivations(assessmentContextArray.join("\n"));
        if (motivationsResults.isErr()) {
            console.error("~~~ Error generating motivations: ", motivationsResults.error);
            return err(motivationsResults.error) as Result<T, Error>;
        }

        console.log("~~~~ GenerateMotivationsAction: Generated motivations:", motivationsResults.value);

        // Create motivations
        const createResult = await this.motivationsService.createMotivations(motivationsResults.value);
        if (createResult.isErr()) {
            console.error("~~~ Error creating motivations: ", createResult.error);
            return err(createResult.error) as Result<T, Error>;
        }

        return ok(true as unknown as T);
    }
} 