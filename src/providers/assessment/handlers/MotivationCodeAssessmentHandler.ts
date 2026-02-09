import { err, ok, Result } from "neverthrow";
import { IAssessmentHandler } from "../AssessmentHandler";
import { DependencyService } from "@src/core/injection/DependencyService";
import { LlmService } from "@src/services/LlmService";
import { injectable } from "tsyringe";

export type MotivationCodeData = {
    motivations: string[];
    assessmentResult: string | null;
};

@injectable()
export class MotivationCodeAssessmentHandler implements IAssessmentHandler {
    readonly assessmentType = 'MotivationCode';
    private readonly motivationDescriptions: Record<string, string> = {
        'Achievement': 'Driven by accomplishing goals and reaching high standards',
        'Challenge': 'Motivated by overcoming obstacles and solving difficult problems',
        'Creativity': 'Inspired by generating new ideas and innovative solutions',
        'Discovery': 'Energized by exploring new possibilities and uncovering insights',
        'Excellence': 'Focused on delivering outstanding quality and performance',
        'Growth': 'Motivated by continuous learning and personal development',
        'Impact': 'Driven by making a meaningful difference and influencing outcomes',
        'Innovation': 'Excited by creating new approaches and transformative solutions',
        'Leadership': 'Inspired by guiding others and shaping direction',
        'Learning': 'Energized by acquiring knowledge and developing expertise',
        'Mastery': 'Focused on developing deep expertise and skill perfection',
        'Purpose': 'Motivated by contributing to meaningful goals and values',
        'Recognition': 'Energized by acknowledgment of contributions and achievements',
        'Service': 'Driven by helping others and making positive contributions',
        'Teamwork': 'Inspired by collaborating with others and achieving shared goals'
    };

    constructor(private userId: string) {}

    private generateSummaryText(data: MotivationCodeData): string {
        const { motivations } = data;
        const summaryParts = motivations.map((motivation, index) => {
            return `${motivation}`;
            // const description = this.motivationDescriptions[motivation] || motivation;
            // return `${index + 1}. ${motivation}: ${description}`;
        });

        return `Top 5 Motivations:\n${summaryParts.join('\n')}`;
    }

    public async generateDetailedSummary(data: MotivationCodeData): Promise<Result<string, Error>> {
        try {
            const summaryText = this.generateSummaryText(data);
            const uploadedText = data.assessmentResult || '';

            const llmService = DependencyService.resolve(LlmService);
            return await llmService.generateSummary(
                `Motivation Code Assessment summary:\n${summaryText}\nMore details about the assessment:\n${uploadedText}`
            );
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create Motivation Code assessment result'));
        }
    }

    async generateSummary(data: MotivationCodeData): Promise<Result<string, Error>> {
        try {
            const summaryText = this.generateSummaryText(data);
            return ok(summaryText);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate Motivation Code summary'));
        }
    }
} 