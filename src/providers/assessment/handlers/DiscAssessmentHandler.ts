import {err, ok, Result} from "neverthrow";
import {IAssessmentHandler} from "../AssessmentHandler";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LlmService} from "@src/services/LlmService";
import {injectable} from "tsyringe";

export type DiscData = {
    scores: Record<string, number>;
    assessmentResult: string | null;
};

@injectable()
export class DiscAssessmentHandler implements IAssessmentHandler {
    readonly assessmentType = 'DISC';
    private readonly traitDescriptions: Record<string, string> = {
        dominance: 'Dominance',
        influence: 'Influence',
        steadiness: 'Steadiness',
        conscientiousness: 'Conscientiousness'
    };

    constructor(private userId: string) {}

    public async generateDetailedSummary(data: DiscData): Promise<Result<string, Error>> {
        try {
            const summaryText = await this.generateSummary(data);
            if (summaryText.isErr()) return err(summaryText.error);
            
            const uploadedText = data.assessmentResult || '';

            const llmService = DependencyService.resolve(LlmService);
            return await llmService.generateSummary(
                `DISC Assessment summary:\n${summaryText.value}\nMore details about the assessment:\n${uploadedText}`
            );
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create DISC assessment result'));
        }
    }

    async generateSummary(data: DiscData): Promise<Result<string, Error>> {
        try {
            const { scores } = data;
            const dominance = scores['dominance'];
            const influence = scores['influence'];
            const steadiness = scores['steadiness'];
            const conscientiousness = scores['conscientiousness'];

            return ok(`Dominance: ${dominance}\nInfluence: ${influence}\nSteadiness: ${steadiness}\nConscientiousness: ${conscientiousness}`);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate DISC summary'));
        }
    }
} 