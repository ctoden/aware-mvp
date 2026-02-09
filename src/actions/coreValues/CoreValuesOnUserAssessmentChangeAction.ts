import {err, ok, Result} from "neverthrow";
import {DependencyService} from "@src/core/injection/DependencyService";
import {UserAssessment} from "@src/models/UserAssessment";
import {LlmService} from "@src/services/LlmService";
import {AssessmentBasedAction} from "../AssessmentBasedAction";
import {CoreValuesActionService} from "./CoreValuesActionService.interface";
import {getUserCoreValuesArray, ICoreValue, upsertCoreValue, UserCoreValue} from "@src/models/UserCoreValue";
import {CreateCoreValuesAction} from "./CreateCoreValuesAction";
import {cloneDeep} from "lodash";
import {ILlmProvider} from "@src/providers/llm/LlmProvider";

export class CoreValuesOnUserAssessmentChangeAction extends AssessmentBasedAction<boolean> {
    name = "CoreValuesOnUserAssessmentChangeAction";
    description = "Create, Read, Update, Delete Core Values based on userAssessments";

    constructor(private coreValuesService: CoreValuesActionService) {
        super();
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        // 1. Make an in-memory copy of the current core values
        const existingCoreValues = cloneDeep(getUserCoreValuesArray());
        
        try {
            // Handle empty assessments array
            if (assessments.length === 0) {
                await this.coreValuesService.clearCoreValues();
                return ok(true);
            }
            
            // Create the context from assessments
            const assessmentContextArray: Array<string> = assessments.map(assessment =>
                assessment.assessment_type + ": " + assessment.assessment_summary
            );
            const assessmentContext = assessmentContextArray.join("\n");
            
            // 2. Clear out existing core values
            const clearResult = await this.coreValuesService.clearCoreValues();
            if (clearResult.isErr()) {
                console.error("~~~ Error clearing core values: ", clearResult.error);
                return err(clearResult.error);
            }
            
            // 3. Use CreateCoreValuesAction to generate and create new core values
            const llmService = DependencyService.resolve(LlmService);
            
            // Ensure LLM provider exists
            if (!llmService.llmProvider) {
                await this.restoreExistingCoreValues(existingCoreValues);
                return err(new Error("LLM provider not available"));
            }
            
            const createCoreValuesAction = new CreateCoreValuesAction(
                llmService.llmProvider, 
                this.coreValuesService
            );
            
            const result = await createCoreValuesAction.execute(assessmentContext);
            if (result.isErr()) {
                // 4. If there's an error, restore the core values from the copy
                await this.restoreExistingCoreValues(existingCoreValues);
                console.error("~~~ Error generating core values: ", result.error);
                return err(result.error);
            }
            
            return ok(true);
        } catch (error) {
            // 4. If there's an error, restore the core values from the copy
            await this.restoreExistingCoreValues(existingCoreValues);
            const typedError = error instanceof Error ? error : new Error('Unknown error occurred');
            console.error("~~~ Unexpected error in CoreValuesOnUserAssessmentChangeAction: ", typedError);
            return err(typedError);
        }
    }
    
    /**
     * Restores core values from a backup array
     * @param coreValues Array of core values to restore
     */
    private async restoreExistingCoreValues(coreValues: UserCoreValue[]): Promise<void> {
        // First clear any potentially partially created values
        await this.coreValuesService.clearCoreValues();
        
        // Then restore the original values
        for (const coreValue of coreValues) {
            upsertCoreValue(coreValue);
        }
    }
}