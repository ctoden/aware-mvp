import { UserModel } from "@src/models/UserModel";
import { ProfessionalDevelopment } from "@src/models/ProfessionalDevelopment";
import { UserAssessment } from "@src/models/UserAssessment";
import { generateUUID } from "@src/utils/UUIDUtil";

/**
 * Creates a mock user for testing
 * @param overrides Optional properties to override default values
 * @returns A mock UserModel
 */
export const createMockUser = (overrides: Partial<UserModel> = {}): UserModel => {
    return {
        id: overrides.id || generateUUID(),
        email: overrides.email || "test@example.com",
        app_metadata: overrides.app_metadata || {},
        user_metadata: overrides.user_metadata || {},
        aud: overrides.aud || "test-aud",
        created_at: overrides.created_at || new Date().toISOString(),
        ...overrides
    };
};

/**
 * Creates a mock professional development object for testing
 * @param userId User ID to associate with the professional development
 * @param overrides Optional properties to override default values
 * @returns A mock ProfessionalDevelopment object
 */
export const createMockProfessionalDevelopment = (
    userId: string,
    overrides: Partial<ProfessionalDevelopment> = {}
): ProfessionalDevelopment => {
    return {
        id: overrides.id || generateUUID(),
        user_id: userId,
        key_terms: overrides.key_terms || ["Leadership", "Strategic Thinking"],
        description: overrides.description || "Test professional development description",
        leadership_style_title: overrides.leadership_style_title || "Strategic Leader",
        leadership_style_description: overrides.leadership_style_description || "A strategic leader who thinks ahead",
        goal_setting_style_title: overrides.goal_setting_style_title || "Achievement Oriented",
        goal_setting_style_description: overrides.goal_setting_style_description || "Sets challenging but achievable goals",
        created_at: overrides.created_at || new Date().toISOString(),
        updated_at: overrides.updated_at || new Date().toISOString(),
        ...overrides
    };
};

/**
 * Creates a mock assessment for testing
 * @param userId User ID to associate with the assessment
 * @param assessmentType Type of assessment (e.g., "Love Languages", "MBTI")
 * @param overrides Optional properties to override default values
 * @returns A mock UserAssessment
 */
export const createMockAssessment = (
    userId: string,
    assessmentType: string = "Love Languages",
    overrides: Partial<UserAssessment> = {}
): UserAssessment => {
    return {
        id: overrides.id || generateUUID(),
        user_id: userId,
        assessment_type: assessmentType,
        name: overrides.name || assessmentType,
        assessment_summary: overrides.assessment_summary || `${assessmentType} summary`,
        assessment_full_text: overrides.assessment_full_text || `Full text for ${assessmentType} assessment`,
        created_at: overrides.created_at || new Date().toISOString(),
        updated_at: overrides.updated_at || new Date().toISOString(),
        ...overrides
    };
};

/**
 * Creates a mock Love Languages assessment
 * @param userId User ID to associate with the assessment
 * @param primaryLanguage Primary love language
 * @param overrides Optional properties to override default values
 * @returns A mock Love Languages assessment
 */
export const createMockLoveLanguagesAssessment = (
    userId: string,
    primaryLanguage: string = "Quality Time",
    overrides: Partial<UserAssessment> = {}
): UserAssessment => {
    return createMockAssessment(
        userId,
        "Love Languages",
        {
            assessment_summary: `${primaryLanguage} is the primary love language.`,
            assessment_full_text: `Full text for Love Languages assessment. Primary: ${primaryLanguage}`,
            ...overrides
        }
    );
};

/**
 * Creates a stringified JSON response for the TestLlmProvider
 * @param keyTerms Array of key terms
 * @param description Description text
 * @param leadershipStyleTitle Leadership style title
 * @param leadershipStyleDescription Leadership style description
 * @param goalSettingStyleTitle Goal setting style title
 * @param goalSettingStyleDescription Goal setting style description
 * @returns Stringified JSON object for professional development
 */
export const createProfessionalDevelopmentLlmResponse = (
    keyTerms: string[] = ["Leadership", "Strategic Thinking"],
    description: string = "Test professional development description",
    leadershipStyleTitle: string = "Strategic Leader",
    leadershipStyleDescription: string = "A strategic leader who thinks ahead",
    goalSettingStyleTitle: string = "Achievement Oriented",
    goalSettingStyleDescription: string = "Sets challenging but achievable goals"
): string => {
    return JSON.stringify({
        entries: {
            key_terms: keyTerms,
            description: description,
            leadership_style_title: leadershipStyleTitle,
            leadership_style_description: leadershipStyleDescription,
            goal_setting_style_title: goalSettingStyleTitle,
            goal_setting_style_description: goalSettingStyleDescription
        }
    });
}; 