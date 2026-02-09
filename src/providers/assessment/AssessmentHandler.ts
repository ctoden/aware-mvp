import { Result } from "neverthrow";
import { UserAssessment } from "@src/models/UserAssessment";

export interface AssessmentResult {
    assessment: UserAssessment;
}

export interface AssessmentSummary {
    assessmentType: string;
    name: string;
    assessment_full_text: string;
    assessment_summary: string;
}

export interface IAssessmentHandler {
    readonly assessmentType: string;
    /**
     * Generate a summary from the assessment data
     */
    generateSummary(data: any): Promise<Result<string, Error>>;
    generateDetailedSummary(data: any): Promise<Result<string, Error>>;
} 