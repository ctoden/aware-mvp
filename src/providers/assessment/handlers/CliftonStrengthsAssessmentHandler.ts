import {err, ok, Result} from "neverthrow";
import {IAssessmentHandler} from "../AssessmentHandler";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LlmService} from "@src/services/LlmService";
import {injectable} from "tsyringe";

export type CliftonStrengthsData = {
    strengths: string[];
    assessmentResult: string | null;
};

@injectable()
export class CliftonStrengthsAssessmentHandler implements IAssessmentHandler {
    readonly assessmentType = 'CliftonStrengths';

    constructor(private userId: string) {}

    public async generateDetailedSummary(data: CliftonStrengthsData): Promise<Result<string, Error>> {
        try {
            const summaryText = await this.generateSummary(data);
            if (summaryText.isErr()) return err(summaryText.error);
            
            const uploadedText = data.assessmentResult || '';

            const llmService = DependencyService.resolve(LlmService);
            return await llmService.generateSummary(
                `CliftonStrengths Assessment summary:\n${summaryText.value}\nMore details about the assessment:\n${uploadedText}`
            );
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create CliftonStrengths assessment result'));
        }
    }

    async generateSummary(data: CliftonStrengthsData): Promise<Result<string, Error>> {
        try {
            const { strengths } = data;
            return ok(strengths.join('\n'));
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate CliftonStrengths summary'));
        }
    }
} 