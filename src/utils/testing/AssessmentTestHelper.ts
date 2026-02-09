import { UserAssessment } from "@src/models/UserAssessment";
import { generateUUID } from "@src/utils/UUIDUtil";
import { ChangeType, emitChange } from "@src/events/ChangeEvent";
import { userAssessments$ } from "@src/models/UserAssessment";
import { waitForChangeActions } from "./FtuxTestHelper";

/**
 * Base function to create and add a new assessment
 * @param userId User ID to associate with the assessment
 * @param assessmentType Type of assessment
 * @param name Name of the assessment
 * @param summary Summary of the assessment
 * @param fullText Full text of the assessment (optional)
 * @param emitChange Whether to emit a change event (default: true)
 * @returns The created assessment
 */
export const createAssessment = (
    userId: string,
    assessmentType: string,
    name: string,
    summary: string,
    fullText: string | null = null,
    shouldEmitChange: boolean = true
): UserAssessment => {
    const assessment: UserAssessment = {
        id: `${assessmentType.toLowerCase()}-${generateUUID()}`,
        user_id: userId,
        assessment_type: assessmentType,
        name,
        assessment_summary: summary,
        assessment_full_text: fullText,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    // Get current assessments and add the new one
    const currentAssessments = userAssessments$.get() || [];
    const updatedAssessments = [...currentAssessments, assessment];
    
    // Update assessments
    userAssessments$.set(updatedAssessments);
    
    // Emit change event if requested
    if (shouldEmitChange) {
        emitChange(ChangeType.USER_ASSESSMENT, updatedAssessments, 'system');
    }
    
    return assessment;
};

/**
 * Creates and adds a Love Languages assessment
 * @param userId User ID to associate with the assessment
 * @param selectedLanguage The selected love language
 * @param shouldEmitChange Whether to emit a change event (default: true)
 * @param waitForActions Whether to wait for change actions to complete (default: false)
 * @returns The created assessment or a promise that resolves to the assessment if waitForActions is true
 */
export const createLoveLanguagesAssessment = async (
    userId: string,
    selectedLanguage: string = 'Quality Time',
    shouldEmitChange: boolean = true,
    waitForActions: boolean = false
): Promise<UserAssessment> => {
    const languageDescriptions: Record<string, string> = {
        'Words of Affirmation': 'Expressing affection through spoken affirmation, praise, or appreciation',
        'Acts of Service': 'Actions, rather than words, are used to show and receive love',
        'Receiving Gifts': 'The love language that thrives on the love, thoughtfulness, and effort behind the gift',
        'Quality Time': 'Expressing affection with undivided, undistracted attention',
        'Physical Touch': 'Expressing and receiving affection through touch, physical closeness and other forms of physical connection'
    };

    const description = languageDescriptions[selectedLanguage] || selectedLanguage;
    const summary = `Primary Love Language: ${selectedLanguage}\nDescription: ${description}`;
    
    const assessment = createAssessment(
        userId,
        'LoveLanguages',
        'Love Languages Assessment',
        summary,
        null,
        shouldEmitChange
    );
    
    if (waitForActions && shouldEmitChange) {
        await waitForChangeActions(ChangeType.USER_ASSESSMENT);
    }
    
    return assessment;
};

/**
 * Creates and adds an MBTI assessment
 * @param userId User ID to associate with the assessment
 * @param mbtiType The MBTI personality type
 * @param shouldEmitChange Whether to emit a change event (default: true)
 * @param waitForActions Whether to wait for change actions to complete (default: false)
 * @returns The created assessment or a promise that resolves to the assessment if waitForActions is true
 */
export const createMbtiAssessment = async (
    userId: string,
    mbtiType: string = 'INTJ',
    shouldEmitChange: boolean = true,
    waitForActions: boolean = false
): Promise<UserAssessment> => {
    const mbtiDescriptions: Record<string, string> = {
        'INTJ': 'The Architect - Imaginative and strategic thinkers with a plan for everything',
        'INTP': 'The Logician - Innovative inventors with an unquenchable thirst for knowledge',
        'ENTJ': 'The Commander - Bold, imaginative and strong-willed leaders',
        'ENTP': 'The Debater - Smart and curious thinkers who cannot resist an intellectual challenge',
        'INFJ': 'The Advocate - Quiet and mystical, yet very inspiring and tireless idealists',
        'INFP': 'The Mediator - Poetic, kind and altruistic people, always eager to help a good cause',
        'ENFJ': 'The Protagonist - Charismatic and inspiring leaders, able to mesmerize their listeners',
        'ENFP': 'The Campaigner - Enthusiastic, creative and sociable free spirits',
        'ISTJ': 'The Logistician - Practical and fact-minded individuals, whose reliability cannot be doubted',
        'ISFJ': 'The Defender - Very dedicated and warm protectors, always ready to defend their loved ones',
        'ESTJ': 'The Executive - Excellent administrators, unsurpassed at managing things or people',
        'ESFJ': 'The Consul - Extraordinarily caring, social and popular people',
        'ISTP': 'The Virtuoso - Bold and practical experimenters, masters of all kinds of tools',
        'ISFP': 'The Adventurer - Flexible and charming artists, always ready to explore and experience something new',
        'ESTP': 'The Entrepreneur - Smart, energetic and very perceptive people',
        'ESFP': 'The Entertainer - Spontaneous, energetic and enthusiastic people'
    };

    const description = mbtiDescriptions[mbtiType] || `${mbtiType} - Personality Type`;
    const summary = `MBTI Type: ${mbtiType}\n${description}`;
    
    const assessment = createAssessment(
        userId,
        'MBTI',
        'MBTI Assessment',
        summary,
        null,
        shouldEmitChange
    );
    
    if (waitForActions && shouldEmitChange) {
        await waitForChangeActions(ChangeType.USER_ASSESSMENT);
    }
    
    return assessment;
};

/**
 * Creates and adds an Enneagram assessment
 * @param userId User ID to associate with the assessment
 * @param enneagramType The Enneagram type (1-9)
 * @param shouldEmitChange Whether to emit a change event (default: true)
 * @param waitForActions Whether to wait for change actions to complete (default: false)
 * @returns The created assessment or a promise that resolves to the assessment if waitForActions is true
 */
export const createEnneagramAssessment = async (
    userId: string,
    enneagramType: number = 1,
    shouldEmitChange: boolean = true,
    waitForActions: boolean = false
): Promise<UserAssessment> => {
    const enneagramDescriptions: Record<number, string> = {
        1: 'The Reformer - Principled, purposeful, self-controlled, and perfectionistic',
        2: 'The Helper - Generous, people-pleasing, and possessive',
        3: 'The Achiever - Adaptable, excelling, driven, and image-conscious',
        4: 'The Individualist - Expressive, dramatic, self-absorbed, and temperamental',
        5: 'The Investigator - Perceptive, innovative, secretive, and isolated',
        6: 'The Loyalist - Engaging, responsible, anxious, and suspicious',
        7: 'The Enthusiast - Spontaneous, versatile, acquisitive, and scattered',
        8: 'The Challenger - Self-confident, decisive, willful, and confrontational',
        9: 'The Peacemaker - Receptive, reassuring, complacent, and resigned'
    };

    const description = enneagramDescriptions[enneagramType] || `Type ${enneagramType}`;
    const summary = `Enneagram Type: ${enneagramType}\n${description}`;
    
    const assessment = createAssessment(
        userId,
        'Enneagram',
        'Enneagram Assessment',
        summary,
        null,
        shouldEmitChange
    );
    
    if (waitForActions && shouldEmitChange) {
        await waitForChangeActions(ChangeType.USER_ASSESSMENT);
    }
    
    return assessment;
};

/**
 * Creates and adds a Big Five assessment
 * @param userId User ID to associate with the assessment
 * @param traits Object containing scores for each of the Big Five traits
 * @param shouldEmitChange Whether to emit a change event (default: true)
 * @param waitForActions Whether to wait for change actions to complete (default: false)
 * @returns The created assessment or a promise that resolves to the assessment if waitForActions is true
 */
export const createBigFiveAssessment = async (
    userId: string,
    traits: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
    } = {
        openness: 0.8,
        conscientiousness: 0.7,
        extraversion: 0.5,
        agreeableness: 0.6,
        neuroticism: 0.3
    },
    shouldEmitChange: boolean = true,
    waitForActions: boolean = false
): Promise<UserAssessment> => {
    const getLevel = (score: number): string => {
        if (score >= 0.8) return 'very high';
        if (score >= 0.6) return 'high';
        if (score >= 0.4) return 'moderate';
        if (score >= 0.2) return 'low';
        return 'very low';
    };

    const summary = `Big Five Personality Traits:
Openness: ${getLevel(traits.openness)} (${Math.round(traits.openness * 100)}%)
Conscientiousness: ${getLevel(traits.conscientiousness)} (${Math.round(traits.conscientiousness * 100)}%)
Extraversion: ${getLevel(traits.extraversion)} (${Math.round(traits.extraversion * 100)}%)
Agreeableness: ${getLevel(traits.agreeableness)} (${Math.round(traits.agreeableness * 100)}%)
Neuroticism: ${getLevel(traits.neuroticism)} (${Math.round(traits.neuroticism * 100)}%)`;
    
    const assessment = createAssessment(
        userId,
        'BigFive',
        'Big Five Assessment',
        summary,
        null,
        shouldEmitChange
    );
    
    if (waitForActions && shouldEmitChange) {
        await waitForChangeActions(ChangeType.USER_ASSESSMENT);
    }
    
    return assessment;
};

/**
 * Creates and adds a StrengthsFinder assessment
 * @param userId User ID to associate with the assessment
 * @param strengths Array of top strengths
 * @param emitChange Whether to emit a model change event (default: true)
 * @param waitForActions Whether to wait for model change actions to complete (default: false)
 * @returns The created assessment or a promise that resolves to the assessment if waitForActions is true
 */
export const createStrengthsFinderAssessment = async (
    userId: string,
    strengths: string[] = ['Strategic', 'Learner', 'Achiever', 'Analytical', 'Relator'],
    emitChange: boolean = true,
    waitForActions: boolean = false
): Promise<UserAssessment> => {
    const summary = `StrengthsFinder Top 5 Strengths:\n${strengths.join(', ')}`;
    
    const assessment = createAssessment(
        userId,
        'StrengthsFinder',
        'StrengthsFinder Assessment',
        summary,
        null,
        emitChange
    );
    
    if (waitForActions && emitChange) {
        await waitForChangeActions(ChangeType.USER_ASSESSMENT);
    }
    
    return assessment;
}; 