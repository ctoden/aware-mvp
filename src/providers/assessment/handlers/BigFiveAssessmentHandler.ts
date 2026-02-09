import {err, ok, Result} from "neverthrow";
import {IAssessmentHandler} from "../AssessmentHandler";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LlmService} from "@src/services/LlmService";
import {injectable} from "tsyringe";

export type BigFiveData = {
    scores: Record<string, number>;
    assessmentResult: string | null;
};

@injectable()
export class BigFiveAssessmentHandler implements IAssessmentHandler {
    readonly assessmentType = 'BigFive';
    private readonly traitDescriptions: Record<string, string> = {
        openness: 'Openness to Experience',
        conscientiousness: 'Conscientiousness',
        extraversion: 'Extraversion',
        agreeableness: 'Agreeableness',
        neuroticism: 'Neuroticism'
    };

    constructor(private userId: string) {}

    private generateSummaryText(data: BigFiveData): string {
        return Object.entries(data.scores)
            .map(([trait, score]) => {
                const description = this.traitDescriptions[trait];
                return `${description}: ${score}/120`;
            })
            .join('\n');
    }

    public async generateDetailedSummary(data: BigFiveData): Promise<Result<string, Error>> {
        try {
            const summaryText = await this.generateSummaryText(data);
            
            const uploadedText = data.assessmentResult || '';

            const llmService = DependencyService.resolve(LlmService);
            return await llmService.generateSummary(
                `Big Five Personality Assessment summary:\n${summaryText}\nMore details about the assessment:\n${uploadedText}`
            );
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create Big Five assessment result'));
        }
    }

    async generateSummary(data: BigFiveData): Promise<Result<string, Error>> {
        try {
            const { scores } = data;
            const openness = scores['openness'];
            const conscientiousness = scores['conscientiousness'];
            const extraversion = scores['extraversion'];
            const agreeableness = scores['agreeableness'];
            const neuroticism = scores['neuroticism'];

            return ok(`Openness: ${openness}\nConscientiousness: ${conscientiousness}\nExtraversion: ${extraversion}\nAgreeableness: ${agreeableness}\nNeuroticism: ${neuroticism}`);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate Big Five summary'));
        }
    }
} 