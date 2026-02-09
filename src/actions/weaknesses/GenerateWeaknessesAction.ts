import { err, ok, Result } from "neverthrow";
import { Action } from "@src/actions/Action";
import { WeaknessesActionService } from "./WeaknessesActionService.interface";
import { ftuxState$ } from "@src/models/FtuxModel";
import { userAssessments$ } from "@src/models/UserAssessment";
import { DependencyService } from "@src/core/injection/DependencyService";
import { LlmService } from "@src/services/LlmService";

export class GenerateWeaknessesAction implements Action<boolean> {
    name = "GenerateWeaknessesAction";
    description = "Generate weaknesses after FTUX completion";

    constructor(private weaknessesService: WeaknessesActionService) {}

    async execute<T = boolean>(): Promise<Result<T, Error>> {

        // Check if we have any assessments to use
        const assessments = userAssessments$.peek();
        if (!assessments || assessments.length === 0) {
            this.log("No assessments found, skipping");
            return ok(true) as Result<T, Error>;
        }

        try {
            // Clear existing weaknesses
            const clearResult = await this.weaknessesService.clearWeaknesses();
            if (clearResult.isErr()) {
                return err(clearResult.error) as Result<T, Error>;
            }

            // Prepare context from assessments
            const assessmentContextArray = assessments.map(assessment => 
                `${assessment.assessment_type}: ${assessment.name}\nDescription: ${assessment.assessment_summary}`
            );

            // Generate weaknesses based on assessments
            const llmService = DependencyService.resolve(LlmService);
            const weaknessesResults = await llmService.generateWeaknesses(assessmentContextArray.join("\n"));
            if (weaknessesResults.isErr()) {
                console.error("~~~ Error generating weaknesses: ", weaknessesResults.error);
                return err(weaknessesResults.error) as Result<T, Error>;
            }

            // Create weaknesses from the generated results
            const weaknesses = weaknessesResults.value;
            this.log(`Generated weaknesses: ${JSON.stringify(weaknesses, null, 2)}`);
            
            const createResult = await this.weaknessesService.createWeaknesses(weaknesses);
            if (createResult.isErr()) {
                return err(createResult.error) as Result<T, Error>;
            }

            return ok(true) as Result<T, Error>;
        } catch (error) {
            this.error(`Error in GenerateWeaknessesAction: ${error}`);
            return err(error instanceof Error ? error : new Error(String(error))) as Result<T, Error>;
        }
    }

    private log(message: string): void {
        console.log(`~~~~ GenerateWeaknessesAction: ${message}`);
    }

    private error(message: string): void {
        console.error(`~~~~ GenerateWeaknessesAction error: ${message}`);
    }
} 