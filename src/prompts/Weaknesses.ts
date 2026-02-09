import { Prompt } from "@src/prompts/Prompt";
import Mustache from "mustache";
import { z } from 'zod';
import { IWeakness } from "@src/models/UserWeakness";

// Base schema for LLM interaction (loose validation)
export const WeaknessSchema = z.object({
    title: z.string(),
    description: z.string()
});

export const WeaknessesResponseSchema = z.object({
    entries: z.array(WeaknessSchema)
});

// Strict schema for validation after LLM response
export const StrictWeaknessSchema = WeaknessSchema.extend({
    title: z.string().min(1).refine(val => val.split(' ').length <= 3, {
        message: "Title must not contain more than 3 words"
    }),
    description: z.string().min(1)
});

export const StrictWeaknessesResponseSchema = z.object({
    entries: z.array(StrictWeaknessSchema).length(4)
});

// Type assertions to ensure schema matches interface
type SchemaType = z.infer<typeof WeaknessSchema>;
type StrictSchemaType = z.infer<typeof StrictWeaknessSchema>;
type _assertSchema = SchemaType extends IWeakness ? true : false;
type _assertStrictSchema = StrictSchemaType extends IWeakness ? true : false;

const weaknessesData = {
    entries: [
        {
            title: "string",
            description: "string"
        },
        {
            title: "string",
            description: "string"
        },
        {
            title: "string",
            description: "string"
        },
        {
            title: "string",
            description: "string"
        }
    ]
};

let cachedResult: string | null = null;

function getJsonSchemaString(): string {
    if(cachedResult) {
        return cachedResult;
    }
    const result = WeaknessesResponseSchema.safeParse(weaknessesData);
    if(!result.success) {
        throw new Error('Invalid weaknesses data');
    }
    cachedResult = JSON.stringify(result.data, null, 2);
    return cachedResult;
}

export const generateWeaknessesPrompt = (includeJsonFormat: boolean = true): Prompt => {
    const baseContent = `Generate 4 weaknesses for my profile and background information.
    With each weakness, answer the question, "What is a key weakness for me?" Each weakness includes a title and description.
    Each weakness should be meaningful and distinct from the others. 
    The title should be 1-3 words long, and the description should be limited to 1 sentence. 
    Maintain an optimistic tone throughout.
    Use 'You' instead of 'I' in the description.`;

    const jsonSchemaString = getJsonSchemaString();
    const jsonFormatInstructions = `
    Return the values in the following JSON format:
    ${jsonSchemaString}
    The response MUST be valid JSON and MUST follow this exact format.`;

    return {
        role: 'user',
        content: `${baseContent}${includeJsonFormat ? jsonFormatInstructions : ''}`
    };
};

export const weaknessesUserContextPrompt = (context: string): Prompt => {
    const prompt = Mustache.render('User Profile and Assessment Context: {{ context }}', { context });
    return { role: 'system', content: prompt };
};

export const retryWeaknessesPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the JSON correct format. 
    Please provide exactly 4 weaknesses in JSON format, where each weakness has a 'title' (1-3 words) and 'description' (1 sentence) field.
    Maintain an optimistic tone throughout.
    The response MUST be valid JSON and MUST follow this exact format.
    Example:
    ${getJsonSchemaString()}`
}); 