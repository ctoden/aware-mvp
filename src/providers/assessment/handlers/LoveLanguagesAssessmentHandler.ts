import {err, ok, Result} from "neverthrow";
import {IAssessmentHandler} from "../AssessmentHandler";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LlmService} from "@src/services/LlmService";
import {injectable} from "tsyringe";

export type LoveLanguagesData = {
    selectedLanguage: string;
    assessmentResult: string | null;
};

@injectable()
export class LoveLanguagesAssessmentHandler implements IAssessmentHandler {
    readonly assessmentType = 'LoveLanguages';
    private readonly languageDescriptions: Record<string, string> = {
        'Words of Affirmation': 'Expressing affection through spoken affirmation, praise, or appreciation',
        'Acts of Service': 'Actions, rather than words, are used to show and receive love',
        'Receiving Gifts': 'The love language that thrives on the love, thoughtfulness, and effort behind the gift',
        'Quality Time': 'Expressing affection with undivided, undistracted attention',
        'Physical Touch': 'Expressing and receiving affection through touch, physical closeness and other forms of physical connection'
    };

    constructor(private userId: string) {}

    private generateSummaryText(data: LoveLanguagesData): string {
        const { selectedLanguage } = data;
        const description = this.languageDescriptions[selectedLanguage] || selectedLanguage;
        return `Primary Love Language: ${selectedLanguage}\nDescription: ${description}`;
    }

    public async generateDetailedSummary(data: LoveLanguagesData): Promise<Result<string, Error>> {
        try {
            const summaryText = this.generateSummaryText(data);
            const uploadedText = data.assessmentResult || '';

            const llmService = DependencyService.resolve(LlmService);
            return await llmService.generateSummary(
                `Love Languages Assessment summary:\n${summaryText}\nMore details about the assessment:\n${uploadedText}`
            );
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create Love Languages assessment result'));
        }
    }

    async generateSummary(data: LoveLanguagesData): Promise<Result<string, Error>> {
        try {
            const summaryText = this.generateSummaryText(data);
            return ok(summaryText);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate Love Languages summary'));
        }
    }
} 