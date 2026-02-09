import { err, Result } from "neverthrow";
import { DependencyService } from "@src/core/injection/DependencyService";
import { UserAssessment } from "@src/models/UserAssessment";
import { LlmService } from "@src/services/LlmService";
import { ok } from "neverthrow";
import { UserTopQuality } from "@src/models/UserTopQuality";
import { AssessmentBasedAction } from "../AssessmentBasedAction";

export interface ITopQualitiesService {
    clearTopQualities(): Promise<Result<boolean, Error>>;
    createTopQuality(quality: Omit<UserTopQuality, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Result<UserTopQuality, Error>>;
}

export class TopQualitiesCrudAction extends AssessmentBasedAction<boolean> {
    name = "TopQualitiesCrudAction";
    description = "Create, Read, Update, Delete Top Qualities based on userAssessments";

    constructor(private topQualitiesService: ITopQualitiesService) {
        super();
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        const prompts: Array<string> = assessments.map(assessment => 
            assessment.assessment_type + ": " + assessment.assessment_summary
        );

        const llmService = DependencyService.resolve(LlmService);
        const topQualitiesResults = await llmService.generateTopQualities(prompts.join("\n"));
        if(topQualitiesResults.isErr()) {
            console.error("~~~ Error generating top qualities: ", topQualitiesResults.error);
            return err(topQualitiesResults.error);
        }

        console.log("~~~~ TopQualitiesCrudAction execute topQualitiesResults: ", topQualitiesResults.value);
        
        const clearResult = await this.topQualitiesService.clearTopQualities();
        if(clearResult.isErr()) {
            console.error("~~~ Error clearing top qualities: ", clearResult.error);
            return err(clearResult.error);
        }
        
        // Loop through generated top qualities and add them to the state
        for (const quality of topQualitiesResults.value) {
            console.log("~~~~ TopQualitiesCrudAction execute quality: ", quality);
            const result = await this.topQualitiesService.createTopQuality(quality);
            if(result.isErr()) {
                console.error("~~~ Error creating top quality: ", result.error);
                return err(result.error);
            }
        }

        return ok(true);
    }
} 