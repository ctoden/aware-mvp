import {err, ok, Result} from "neverthrow";
import {IAssessmentHandler} from "../AssessmentHandler";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LlmService} from "@src/services/LlmService";
import {injectable} from "tsyringe";

export type EnneagramData = {
    scores: Record<string, number>;
    assessmentResult: string | null;
};

@injectable()
export class EnneagramAssessmentHandler implements IAssessmentHandler {
    readonly assessmentType = 'Enneagram';
    private readonly typeDescriptions: Record<string, string> = {
        type1: 'The Reformer',
        type2: 'The Helper',
        type3: 'The Achiever',
        type4: 'The Individualist',
        type5: 'The Investigator',
        type6: 'The Loyalist',
        type7: 'The Enthusiast',
        type8: 'The Challenger',
        type9: 'The Peacemaker'
    };

    constructor(private userId: string) {}

    public async generateDetailedSummary(data: EnneagramData): Promise<Result<string, Error>> {
        try {
            const summaryText = await this.generateSummary(data);
            if (summaryText.isErr()) return err(summaryText.error);
            
            const uploadedText = data.assessmentResult || '';

            const llmService = DependencyService.resolve(LlmService);
            return await llmService.generateSummary(
                `Enneagram Assessment summary:\n${summaryText.value}\nMore details about the assessment:\n${uploadedText}`
            );
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create Enneagram assessment result'));
        }
    }

    async generateSummary(data: EnneagramData): Promise<Result<string, Error>> {
        try {
            const { scores } = data;
            const summaryParts = Object.entries(scores).map(([type, score]) => {
                const description = this.typeDescriptions[type] || type;
                return `${description}: ${score}`;
            });

            return ok(summaryParts.join('\n'));
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate Enneagram summary'));
        }
    }
} 