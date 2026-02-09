import { generateUUID } from "@src/utils/UUIDUtil";
import { UserCoreValue, CoreValueType } from "@src/models/UserCoreValue";

/**
 * Creates a mock UserCoreValue object
 * @param userId The user ID who owns the core value
 * @param overrides Optional properties to override default values
 * @returns A mock UserCoreValue object
 */
export const createMockCoreValue = (
    userId: string,
    overrides: Partial<UserCoreValue> = {}
): UserCoreValue => {
    const now = new Date().toISOString();

    return {
        id: generateUUID(),
        user_id: userId,
        title: "Test Core Value",
        description: "This is a test core value description",
        value_type: CoreValueType.SYSTEM_GENERATED,
        created_at: now,
        updated_at: now,
        ...overrides
    };
};

/**
 * Creates a set of mock core values for a user
 * @param userId The user ID who owns the core values
 * @param count The number of core values to create (default: 3)
 * @returns An array of mock UserCoreValue objects
 */
export const createMockCoreValues = (
    userId: string,
    count: number = 3
): UserCoreValue[] => {
    const coreValues: UserCoreValue[] = [];

    const values = [
        { title: "Integrity", description: "Acting with strong moral principles" },
        { title: "Empathy", description: "Understanding and sharing the feelings of others" },
        { title: "Growth", description: "Continuous personal and professional development" },
        { title: "Creativity", description: "Thinking outside the box and finding innovative solutions" },
        { title: "Excellence", description: "Striving for the highest standards in all endeavors" }
    ];

    for (let i = 0; i < Math.min(count, values.length); i++) {
        coreValues.push(createMockCoreValue(userId, values[i]));
    }

    return coreValues;
};

/**
 * Creates a mock LLM response for core values generation
 * @param values Array of core value titles and descriptions
 * @returns A mock LLM response for core values
 */
export const createCoreValuesLlmResponse = (
    values: Array<{ title: string; description: string }> = [
        { title: "Integrity", description: "Acting with strong moral principles" },
        { title: "Empathy", description: "Understanding and sharing the feelings of others" },
        { title: "Growth", description: "Continuous personal and professional development" }
    ]
): string => {
    return JSON.stringify({
        core_values: values
    });
}; 