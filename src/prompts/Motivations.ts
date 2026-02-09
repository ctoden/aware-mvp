import { Prompt } from "@src/prompts/Prompt";
import Mustache from "mustache";
import { z } from 'zod';

export const MotivationSchema = z.object({
    title: z.string(),
    description: z.string()
});

export const MotivationsResponseSchema = z.object({
    entries: z.array(MotivationSchema)
});

export const StrictMotivationSchema = MotivationSchema.extend({
    title: z.string().min(1).refine(val => val.split(' ').length <= 3, {
        message: "Title must not contain more than 3 words"
    }),
    description: z.string().min(1)
});

export const StrictMotivationsResponseSchema = MotivationsResponseSchema.extend({
    entries: z.array(StrictMotivationSchema).length(3)
})

const motivationsData = {
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
        }
    ]
}

let cachedResult: string | null = null;

function getJsonSchemaString(): string {
    if(cachedResult) {
        return cachedResult;
    }
    const result = MotivationsResponseSchema.safeParse(motivationsData);
    if(!result.success) {
        throw new Error('Invalid motivations data');
    }
    cachedResult = JSON.stringify(result.data, null, 2);
    return cachedResult;
}

export const generateMotivationsPrompt = (includeJsonFormat: boolean = true): Prompt => {
    const baseContent = `Generate 3 high-level motivations based on my profile. 
    With each motivation, answer the question, "What is a key driver for me?" 
    Each motivation includes a title and description. 
    The title should be 1-3 words long, and the description should be limited to 1 sentence. 
    Focus on positive aspects of my personality.
    The motivations should be unique and not similar to each other.
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

export const retryMotivationsPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. 
    Please provide exactly 3 motivations in JSON format, where each motivation has a 'title' (1-3 words) and 'description' (1 sentence) field.
    The response MUST be valid JSON and MUST follow this exact format.
    Example:
    ${getJsonSchemaString()}`
}); 