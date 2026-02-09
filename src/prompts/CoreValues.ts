import { Prompt } from "@src/prompts/Prompt";
import Mustache from "mustache";
import { z } from 'zod';

export const CoreValueSchema = z.object({
  core_values: z.array(z.object({
    title: z.string(),
    description: z.string()
  }))
});

const coreValuesData = {
    core_values: [
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
    const result = CoreValueSchema.safeParse(coreValuesData);
    if(!result.success) {
        throw new Error('Invalid core values data');
    }
    cachedResult = JSON.stringify(result.data, null, 2);
    return cachedResult;
}


export const generateCoreValuesPrompt = (includeJsonFormat: boolean = true): Prompt => {
  const baseContent = `Generate 3 core values based on my profile and background information. 
Each core value includes a title and description.
The title should be 1-3 words long, and the description should be limited to 1 sentence. Focus on positive values I
most likely uses to guide my beliefs and decisions in all aspects of my life. Do not make 'I' statements;
speak as if you are speaking directly to me and do not act as if you are a chatbot.

Each core value must be meaningful and distinct from the others.
`;

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

export const retryCoreValuesPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please format the response as a JSON array containing exactly 3 objects, 
    each with a "title" (1-3 words) and "description" (1 sentence) field. The response should look exactly like this:
    [
        {
            "title": "string",
            "description": "string"
        }
    ]`
});