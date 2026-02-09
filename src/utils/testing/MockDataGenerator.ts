import { UserProfile } from "@src/models/UserProfile";
import { UserAssessment } from "@src/models/UserAssessment";
import { FamilyStoryData } from "@src/models/FamilyStoryModel";
import { CareerJourneyEntry } from "@src/models/CareerJourneyModel";
import { UserMainInterest, UserMainInterests } from "@src/models/UserMainInterest";
import { generateUUID } from "@src/utils/UUIDUtil";

/**
 * Generates a mock user with random values for testing
 * @param overrides Optional values to override defaults
 * @returns A mock user object
 */
export const generateMockUser = (overrides: Partial<any> = {}) => {
    const userId = overrides.id || `user-${generateUUID()}`;
    const timestamp = new Date().toISOString();
    
    return {
        id: userId,
        email: overrides.email || `test-${Math.floor(Math.random() * 10000)}@example.com`,
        app_metadata: overrides.app_metadata || {},
        user_metadata: overrides.user_metadata || {},
        aud: overrides.aud || "authenticated",
        created_at: overrides.created_at || timestamp,
        ...overrides
    };
};

/**
 * Generates a mock user profile for testing
 * @param userId User ID to associate with the profile
 * @param overrides Optional values to override defaults
 * @returns A mock UserProfile object
 */
export const generateMockProfile = (userId: string, overrides: Partial<UserProfile> = {}): UserProfile => {
    return {
        id: userId,
        full_name: overrides.full_name || 'Test User',
        avatar_url: overrides.avatar_url || null,
        website: overrides.website || null,
        summary: overrides.summary || null,
        phone_number: overrides.phone_number || '123-456-7890',
        updated_at: overrides.updated_at || new Date().toISOString(),
        family_story: overrides.family_story || null,
        primary_occupation: overrides.primary_occupation || null,
        birth_date: overrides.birth_date || null
    };
};

/**
 * Generates mock assessments for testing
 * @param userId User ID to associate with the assessments
 * @param count Number of assessments to generate
 * @param overrides Optional values to override defaults
 * @returns An array of mock UserAssessment objects
 */
export const generateMockAssessments = (
    userId: string, 
    count: number = 2,
    overrides: Partial<UserAssessment> = {}
): UserAssessment[] => {
    const assessmentTypes = ['MBTI', 'Big Five', 'Enneagram', 'DISC', 'StrengthsFinder'];
    const assessments: UserAssessment[] = [];
    
    for (let i = 0; i < count; i++) {
        const assessmentType = assessmentTypes[i % assessmentTypes.length];
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - i); // Each assessment is a day older
        
        assessments.push({
            id: overrides.id || `assessment-${i}-${generateUUID()}`,
            user_id: userId,
            assessment_type: overrides.assessment_type || assessmentType,
            name: overrides.name || `${assessmentType} Assessment`,
            assessment_summary: overrides.assessment_summary || generateMockAssessmentSummary(assessmentType),
            assessment_full_text: overrides.assessment_full_text || null,
            created_at: overrides.created_at || timestamp.toISOString(),
            updated_at: overrides.updated_at || timestamp.toISOString()
        });
    }
    
    return assessments;
};

/**
 * Generates a family story object for testing
 * @param storyText Optional story text
 * @returns Family story object
 */
export const generateMockFamilyStory = (storyText?: string): FamilyStoryData => {
    return {
        story: storyText || 'Grew up in a small town with two siblings. Parents were teachers who emphasized education and creativity.'
    };
};

/**
 * Generates career journey entries for testing
 * @param count Number of career entries to generate
 * @returns Array of career journey entry objects
 */
export const generateMockCareerJourney = (count: number = 2): CareerJourneyEntry[] => {
    const entries: CareerJourneyEntry[] = [];
    
    const careerPaths = [
        'Started as a Junior Developer at TechStart Inc in 2015. Built web applications using modern frameworks.',
        'Promoted to Senior Developer at Enterprise Solutions in 2017. Leading development teams and architecting complex systems.',
        'Became CTO at Startup Innovation in 2020. Overseeing all technical decisions and strategy.',
        'Worked as a Technical Consultant for various Fortune 500 companies.',
        'Freelance developer specializing in mobile applications and responsive design.'
    ];
    
    for (let i = 0; i < Math.min(count, careerPaths.length); i++) {
        entries.push({
            id: `career-${i + 1}`,
            journey: careerPaths[i]
        });
    }
    
    return entries;
};

/**
 * Generates main interests for testing
 * @param userId User ID to associate with interests
 * @param count Number of interests to generate
 * @returns UserMainInterests object
 */
export const generateMockInterests = (userId: string, count: number = 5): UserMainInterests => {
    const interests = [
        'Technology',
        'Travel',
        'Photography',
        'Reading',
        'Music',
        'Sports',
        'Cooking',
        'Art',
        'Gaming',
        'Hiking'
    ];
    
    const mainInterests: UserMainInterests = {};
    
    for (let i = 0; i < Math.min(count, interests.length); i++) {
        const id = `interest-${i + 1}-${generateUUID()}`;
        const timestamp = new Date().toISOString();
        
        mainInterests[id] = {
            id,
            user_id: userId,
            interest: interests[i],
            created_at: timestamp,
            updated_at: timestamp
        };
    }
    
    return mainInterests;
};

/**
 * Generates a mock assessment summary based on type
 * @param assessmentType The type of assessment
 * @returns A mock assessment summary
 */
function generateMockAssessmentSummary(assessmentType: string): string {
    switch (assessmentType) {
        case 'MBTI':
            return ['INTJ - The Architect', 'ENFP - The Champion', 'ISTP - The Craftsman'][Math.floor(Math.random() * 3)];
        case 'Big Five':
            return 'High openness, high conscientiousness, moderate extraversion';
        case 'Enneagram':
            return `Type ${Math.floor(Math.random() * 9) + 1} - ${['Reformer', 'Helper', 'Achiever', 'Individualist'][Math.floor(Math.random() * 4)]}`;
        case 'DISC':
            return ['Dominance', 'Influence', 'Steadiness', 'Conscientiousness'][Math.floor(Math.random() * 4)];
        case 'StrengthsFinder':
            return 'Strategic Thinking, Relationship Building, Execution';
        default:
            return 'General assessment summary';
    }
} 