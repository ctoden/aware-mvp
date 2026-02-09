import { generateUUID } from "@src/utils/UUIDUtil";
import { UserMotivation, MotivationType } from "@src/models/UserMotivation";

/**
 * Creates a mock UserMotivation object
 * @param userId The user ID who owns the motivation
 * @param overrides Optional properties to override default values
 * @returns A mock UserMotivation object
 */
export const createMockMotivation = (
    userId: string,
    overrides: Partial<UserMotivation> = {}
): UserMotivation => {
    const now = new Date().toISOString();

    return {
        id: generateUUID(),
        user_id: userId,
        title: "Test Motivation",
        description: "This is a test motivation description",
        motivation_type: MotivationType.SYSTEM_GENERATED,
        created_at: now,
        updated_at: now,
        ...overrides
    };
};

/**
 * Creates a set of mock motivations for a user
 * @param userId The user ID who owns the motivations
 * @param count The number of motivations to create (default: 3)
 * @returns An array of mock UserMotivation objects
 */
export const createMockMotivations = (
    userId: string,
    count: number = 3
): UserMotivation[] => {
    const motivations: UserMotivation[] = [];

    const values = [
        { title: "Achievement", description: "Driven by setting and reaching ambitious goals" },
        { title: "Recognition", description: "Motivated by appreciation and acknowledgment from others" },
        { title: "Growth", description: "Energized by continuous learning and self-improvement" },
        { title: "Creativity", description: "Inspired by opportunities to innovate and create" },
        { title: "Connection", description: "Motivated by building meaningful relationships" }
    ];

    for (let i = 0; i < Math.min(count, values.length); i++) {
        motivations.push(createMockMotivation(userId, values[i]));
    }

    return motivations;
};

/**
 * Creates a mock LLM response for motivations generation
 * @param values Array of motivation titles and descriptions
 * @returns A mock LLM response for motivations
 */
export const createMotivationsLlmResponse = (
    values: Array<{ title: string; description: string }> = [
        { title: "Achievement", description: "Driven by setting and reaching ambitious goals" },
        { title: "Growth", description: "Energized by continuous learning and self-improvement" },
        { title: "Connection", description: "Motivated by building meaningful relationships" }
    ]
): string => {
    return JSON.stringify({
        entries: values
    });
}; 