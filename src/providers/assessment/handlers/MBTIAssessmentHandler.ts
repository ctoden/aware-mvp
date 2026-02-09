import {err, ok, Result} from "neverthrow";
import {IAssessmentHandler} from "../AssessmentHandler";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LlmService} from "@src/services/LlmService";
import {injectable} from "tsyringe";
import {MBTIDichotomies} from "@src/models/assessments/mbti";

export type MBTIData = { dichotomies: MBTIDichotomies, assessmentResult: string | null };

@injectable()
export class MBTIAssessmentHandler implements IAssessmentHandler {
    readonly assessmentType = 'MBTI';
    private readonly dichotomyDescriptions: Record<string, string> = {
        E: 'Extroversion',
        I: 'Introversion',
        S: 'Sensing',
        N: 'Intuition',
        T: 'Thinking',
        F: 'Feeling',
        J: 'Judging',
        P: 'Perceiving'
    };

    constructor(private userId: string) {}

    private generateSummaryText(data: MBTIData): string {
        const dichotomies = data.dichotomies;
        
        // Create an array of non-null dichotomy values with their descriptions
        const formattedValues = [];
        
        if (dichotomies.energy) {
            formattedValues.push(`${dichotomies.energy} - ${this.dichotomyDescriptions[dichotomies.energy]}`);
        }
        
        if (dichotomies.information) {
            formattedValues.push(`${dichotomies.information} - ${this.dichotomyDescriptions[dichotomies.information]}`);
        }
        
        if (dichotomies.decision) {
            formattedValues.push(`${dichotomies.decision} - ${this.dichotomyDescriptions[dichotomies.decision]}`);
        }
        
        if (dichotomies.lifestyle) {
            formattedValues.push(`${dichotomies.lifestyle} - ${this.dichotomyDescriptions[dichotomies.lifestyle]}`);
        }
        
        // Join with newlines
        return formattedValues.join('\n');
    }

    public async generateDetailedSummary(data: MBTIData): Promise<Result<string, Error>> {
        try {
            const summaryText = this.generateSummaryText(data);
            const uploadedText = data.assessmentResult || '';

            const llmService = DependencyService.resolve(LlmService);
            return await llmService.generateSummary(`Myers Briggs (MBTI) summary: ${summaryText} \nMore details about the users MBTI: ${uploadedText} `);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create MBTI assessment result'));
        }
    }


    async generateSummary(data: MBTIData): Promise<Result<string, Error>> {
        try {
            const summaryText = this.generateSummaryText(data);
            return ok(summaryText);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate MBTI summary'));
        }
    }
} 