import { z } from "zod";
import { Prompt } from "@src/prompts/Prompt";
import Mustache from "mustache";
import { hasEmoji } from "@src/utils/EmojiUtils";

// Base schema for LLM interaction (loose validation)
export const UserQuickInsightSchema = z.object({
    title: z.string(),
    description: z.string()
});

export const UserQuickInsightResponseSchema = z.object({
    entries: UserQuickInsightSchema
});

// Strict schema for validation after LLM response
export const StrictUserQuickInsightSchema = UserQuickInsightSchema.extend({
    title: z.string().max(25),
    description: z.string().max(500).refine(hasEmoji, {
        message: "Description must include an emoji"
    })
});

export const StrictUserQuickInsightResponseSchema = z.object({
    entries: StrictUserQuickInsightSchema
});

const quickInsightData = {
    entries: {
        title: "string",
        description: "string"
    }
};

let cachedResult: string | null = null;

function getJsonSchemaString(): string {
    if(cachedResult) {
        return cachedResult;
    }
    const result = UserQuickInsightResponseSchema.safeParse(quickInsightData);
    if(!result.success) {
        throw new Error('Invalid quick insight data');
    }
    cachedResult = JSON.stringify(result.data, null, 2);
    return cachedResult;
}

export const generateUserQuickInsightPrompt = (includeJsonFormat: boolean = true): Prompt => {
    const baseContent = `Generate a unique and personalized insight based on my profile and background.
    The insight includes a title and description. 
    The title should be no more than 25 characters, and the description should be limited to one sentence. 
    The insight can be a bit playful, offering the kind of "tough love" advice I might receive from a close friend who knows me really well. 
    The insight title does not describe me, but rather introduces the advice being given. 
    Consider my entire personality, and use this as an opportunity to help me grow and improve as a person. 
    Highlight my potential blind spots, weaknesses, or areas of opportunity for improvement. 
    Include one emoji in the description.`;

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

export const retryUserQuickInsightPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please format the response as a JSON object with an "entries" object containing a "title" 
    (less than 25 characters) and "description" field. The response should have this exact JSON structure:
    ${getJsonSchemaString()}`
});