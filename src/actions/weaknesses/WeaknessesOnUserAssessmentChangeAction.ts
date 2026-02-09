import { err, ok, Result } from "neverthrow";
import { DependencyService } from "@src/core/injection/DependencyService";
import { UserAssessment } from "@src/models/UserAssessment";
import { WeaknessType, UserWeakness, userWeaknesses$ } from "@src/models/UserWeakness";
import { IWeakness } from "@src/models/UserWeakness";
import { LlmService } from "@src/services/LlmService";
import { AssessmentBasedAction } from "../AssessmentBasedAction";
import { WeaknessesActionService } from "./WeaknessesActionService.interface";
import { ftuxState$ } from "@src/models/FtuxModel";

export interface IWeaknessesService {
    clearWeaknesses(): Promise<Result<boolean, Error>>;
    createWeakness(value: IWeakness, type?: WeaknessType): Promise<Result<UserWeakness, Error>>;
}

export class WeaknessesOnUserAssessmentChangeAction extends AssessmentBasedAction<boolean> {
    name = "WeaknessesOnUserAssessmentChangeAction";
    description = "Update weaknesses based on user assessments";

    constructor(private weaknessesService: WeaknessesActionService) {
        super();
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        try {
            // Only process assessments if FTUX is completed
            if (!ftuxState$.peek().hasCompletedFTUX) {
                return ok(true);
            }
            
            if (!assessments || assessments.length === 0) {
                return ok(true);
            }

            // Store old weaknesses in memory before clearing them
            const oldWeaknesses = { ...userWeaknesses$.peek() };
            
            // Clear existing weaknesses before generating new ones
            const clearResult = await this.weaknessesService.clearWeaknesses();
            if (clearResult.isErr()) {
                return err(clearResult.error);
            }

            // Prepare context from assessments
            const assessmentContextArray = assessments.map(assessment => 
                `${assessment.assessment_type}: ${assessment.name}\nDescription: ${assessment.assessment_summary}`
            );
            const context = assessmentContextArray.join("\n");

            // Get the LLM service and generate weaknesses
            const llmService = DependencyService.resolve(LlmService);
            const weaknessesResult = await llmService.generateWeaknesses(context);

            if (weaknessesResult.isErr()) {
                // Restore old weaknesses if we fail to generate new ones
                userWeaknesses$.set(oldWeaknesses);
                return err(weaknessesResult.error);
            }

            // Create the weaknesses in the database
            const weaknesses = weaknessesResult.value;
            const createResult = await this.weaknessesService.createWeaknesses(weaknesses);

            if (createResult.isErr()) {
                // Restore old weaknesses if we fail to create new ones
                userWeaknesses$.set(oldWeaknesses);
                return err(createResult.error);
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
} 