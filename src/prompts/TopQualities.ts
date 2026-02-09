import { Prompt } from "@src/prompts/Prompt";
import Mustache from "mustache";
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import { IUserTopQuality } from "@src/models/UserTopQuality";

// Base schema for LLM interaction (loose validation)
export const TopQualitySchema = z.object({
    title: z.string(),
    level: z.string(),
    description: z.string(),
    score: z.number()
});

export const TopQualitiesResponseSchema = z.object({
    entries: z.array(TopQualitySchema)
});

// Strict schema for validation after LLM response
export const StrictTopQualitySchema = TopQualitySchema.extend({
    title: z.string().min(1),
    level: z.string().min(1),
    description: z.string().min(1),
    score: z.number().min(0).max(100)
});

export const StrictTopQualitiesResponseSchema = z.object({
    entries: z.array(StrictTopQualitySchema).length(8)
});

// Type assertions to ensure schema matches interface
type SchemaType = z.infer<typeof TopQualitySchema>;
type StrictSchemaType = z.infer<typeof StrictTopQualitySchema>;
type _assertSchema = SchemaType extends Omit<IUserTopQuality, 'color'> ? true : false;
type _assertStrictSchema = StrictSchemaType extends Omit<IUserTopQuality, 'color'> ? true : false;

const topQualitiesData = {
    entries: [
        {
            title: "string",
            level: "string",
            description: "string",
            score: 0
        },
        {
            title: "string",
            level: "string",
            description: "string",
            score: 0
        },
        {
            title: "string",
            level: "string",
            description: "string",
            score: 0
        },
        {
            title: "string",
            level: "string",
            description: "string",
            score: 0
        },
        {
            title: "string",
            level: "string",
            description: "string",
            score: 0
        },
        {
            title: "string",
            level: "string",
            description: "string",
            score: 0
        },
        {
            title: "string",
            level: "string",
            description: "string",
            score: 0
        },
        {
            title: "string",
            level: "string",
            description: "string",
            score: 0
        }
    ]
};

let cachedResult: string | null = null;

function getJsonSchemaString(): string {
    if(cachedResult) {
        return cachedResult;
    }
    const result = TopQualitiesResponseSchema.safeParse(topQualitiesData);
    if(!result.success) {
        throw new Error('Invalid top qualities data');
    }
    cachedResult = JSON.stringify(result.data, null, 2);
    return cachedResult;
}

export const generateTopQualitiesPrompt = (includeJsonFormat: boolean = true): Prompt => {
    const baseContent = `Based on my combined personality test results, choose a score out of 10 for each of the following, then sort them from highest to lowest. 
Include a one-sentence description for each: 
- Extraversion: My level of sociability, assertiveness, emotional expressiveness, and preference for seeking out stimulation and the company of others
- Emotional Stability: My emotional stability and tendency to experience negative emotions, such as anxiety, sadness, and anger
- Agreeableness: My tendency to be compassionate, cooperative, and trusting towards others
- Spirituality: The extent to which I engage in and commit to spiritual beliefs and practices
- Openness: My level of curiosity, imagination, and appreciation for new ideas and experiences
- Rationality: The extent to which I rely on logic, objectivity, and empirical evidence when making decisions, solving problems, and forming opinions
- Conscientiousness: My level of self-control, organization, and goal-directed behavior
- Honesty-Humility: The extent to which I am self-aware, open to feedback, willing to admit mistakes, and respectful of others

Do not make 'I' statements, speak as if you are speaking to the user directly (use 'you' instead of 'I') and not as if you are a chatbot.
Do not include an disclaimers, I know that I'm talking to a chatbot.`;

    const jsonSchemaString = getJsonSchemaString();
    const jsonFormatInstructions = `
    Return the values in the following JSON format:
    ${jsonSchemaString}
    The response MUST be valid JSON and MUST follow this exact format.`;

    return {
        role: 'system',
        content: `${baseContent}${includeJsonFormat ? jsonFormatInstructions : ''}`
    };
};

export const retryTopQualitiesPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. 
    Please provide exactly 8 qualities in JSON format, where each quality has a 'title', 'level', 'description', and 'score' field.
    The response MUST be valid JSON and MUST follow this exact format.
    Example:
    ${getJsonSchemaString()}`
});
