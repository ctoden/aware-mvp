import { err, ok, Result } from "neverthrow";
import { DependencyService } from "@src/core/injection/DependencyService";
import { UserAssessment } from "@src/models/UserAssessment";
import { ProfessionalDevelopment } from "@src/models/ProfessionalDevelopment";
import { LlmService } from "@src/services/LlmService";
import { AssessmentBasedAction } from "../AssessmentBasedAction";
import { CreateProfessionalDevelopmentAction } from "./CreateProfessionalDevelopmentAction";
import { IProfessionalDevelopmentService } from "./IProfessionalDevelopmentService";

export class ProfessionalDevelopmentOnUserAssessmentChangeAction extends AssessmentBasedAction<boolean> {
    name = "ProfessionalDevelopmentCrudAction";
    description = "Create, Read, Update, Delete Professional Development based on userAssessments";

    constructor(private professionalDevelopmentService: IProfessionalDevelopmentService) {
        super();
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        const assessmentContextArray: Array<string> = assessments.map(assessment =>
            assessment.assessment_type + ": " + assessment.assessment_summary
        );

        const llmService = DependencyService.resolve(LlmService);
        if(!llmService || !llmService.llmProvider) {
            return err(new Error("LlmService not found"));
        }

        const profDevResults = await new CreateProfessionalDevelopmentAction(llmService.llmProvider).execute(assessmentContextArray.join("\n"));
        if(profDevResults.isErr()) {
            console.error("~~~ Error generating professional development: ", profDevResults.error);
            return err(profDevResults.error);
        }

        console.log("~~~~ ProfessionalDevelopmentCrudAction execute profDevResults: ", profDevResults.value);
        
        const clearResult = await this.professionalDevelopmentService.clearProfessionalDevelopment();
        if(clearResult.isErr()) {
            console.error("~~~ Error clearing professional development: ", clearResult.error);
            return err(clearResult.error);
        }
        
        const result = await this.professionalDevelopmentService.createProfessionalDevelopment(profDevResults.value);
        if(result.isErr()) {
            console.error("~~~ Error creating professional development: ", result.error);
            return err(result.error);
        }

        return ok(true);
    }
} 