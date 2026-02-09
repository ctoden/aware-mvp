import { Prompt } from "@src/prompts/Prompt";
import Mustache from "mustache";
import { z } from "zod";

// Basic schemas without validation
export const KeyTermsSchema = z.object({
    entries: z.object({
        key_terms: z.array(z.string())
    })
});

export const DescriptionSchema = z.object({
    entries: z.object({
        description: z.string()
    })
});

export const CommunicationStyleSchema = z.object({
    entries: z.object({
        title: z.string(),
        description: z.string()
    })
});

export const ConflictResolutionStyleSchema = z.object({
    entries: z.object({
        title: z.string(),
        description: z.string()
    })
});

export const AttachmentStyleSchema = z.object({
    entries: z.object({
        title: z.string(),
        description: z.string()
    })
});

// Strict schemas with validation
export const StrictKeyTermsSchema = KeyTermsSchema.extend({
    entries: z.object({
        key_terms: z.array(z.string()).length(5)
    })
});

export const StrictDescriptionSchema = DescriptionSchema.extend({
    entries: z.object({
        description: z.string().min(1)
    })
});

export const StrictCommunicationStyleSchema = CommunicationStyleSchema.extend({
    entries: z.object({
        title: z.string().min(1),
        description: z.string().min(1)
    })
});

export const StrictConflictResolutionStyleSchema = ConflictResolutionStyleSchema.extend({
    entries: z.object({
        title: z.string().min(1),
        description: z.string().min(1)
    })
});

export const StrictAttachmentStyleSchema = AttachmentStyleSchema.extend({
    entries: z.object({
        title: z.string().min(1),
        description: z.string().min(1)
    })
});

// Example data for schema generation
const keyTermsData = {
    entries: {
        key_terms: ["string", "string", "string", "string", "string"]
    }
};

const descriptionData = {
    entries: {
        description: "string"
    }
};

const styleData = {
    entries: {
        title: "string",
        description: "string"
    }
};

// Cache results
let cachedKeyTerms: string | null = null;
let cachedDescription: string | null = null;
let cachedStyle: string | null = null;

function getKeyTermsJsonSchema(): string {
    if (cachedKeyTerms) return cachedKeyTerms;
    const result = KeyTermsSchema.safeParse(keyTermsData);
    if (!result.success) throw new Error('Invalid key terms data');
    cachedKeyTerms = JSON.stringify(result.data, null, 2);
    return cachedKeyTerms;
}

function getDescriptionJsonSchema(): string {
    if (cachedDescription) return cachedDescription;
    const result = DescriptionSchema.safeParse(descriptionData);
    if (!result.success) throw new Error('Invalid description data');
    cachedDescription = JSON.stringify(result.data, null, 2);
    return cachedDescription;
}

function getStyleJsonSchema(): string {
    if (cachedStyle) return cachedStyle;
    const result = CommunicationStyleSchema.safeParse(styleData);
    if (!result.success) throw new Error('Invalid style data');
    cachedStyle = JSON.stringify(result.data, null, 2);
    return cachedStyle;
}

export const generateUserRelationshipsKeyTermsPrompt = (includeJsonFormat: boolean = true): Prompt => {
    const baseContent = 
    `Generate 5 key terms that represent my strengths within the context of building and maintaining relationships. 
    Each key term should be an adjective describing me. Use sentence case for each key term. 
    Here are some examples:
    - "Intuitive"
    - "Empathetic"
    - "Assertive"
    - "Optimistic"
    - "Self-aware"
    
    Each key term should be meaningful and distinct from the others.`;

    const jsonSchemaString = getKeyTermsJsonSchema();
    const jsonFormatInstructions = `
    Return the values in the following JSON format:
    ${jsonSchemaString}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`;

    return {
        role: 'user',
        content: `${baseContent}${includeJsonFormat ? jsonFormatInstructions : ''}`
    };
};

export const generateUserRelationshipsDescriptionPrompt = (includeJsonFormat: boolean = true): Prompt => {
    const baseContent = 
    `Write a brief description of my approach to building and maintaining relationships. 
    Highlight my communication style, level of empathy, and/or conflict resolution strategies. 
    Keep the length to 2 sentences maximum. Do not make 'I' statements, speak as if you are speaking to me directly 
    (use 'you' instead of 'I') and not as if you are a chatbot.
    Here is an example:
    "You thrive in relationships where your independence and intellectual curiosity are respected, and where open, honest communication is prioritized."`;

    const jsonSchemaString = getDescriptionJsonSchema();
    const jsonFormatInstructions = `
    Return the values in the following JSON format:
    ${jsonSchemaString}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`;

    return {
        role: 'user',
        content: `${baseContent}${includeJsonFormat ? jsonFormatInstructions : ''}`
    };
};

export const generateUserRelationshipsCommunicationStylePrompt = (includeJsonFormat: boolean = true): Prompt => {
    const baseContent = `Based on my combined personality test results, analyze my communication style.
    Choose one of the following styles: Assertive, Passive, Passive-Aggressive, Aggressive.
    Provide a title and description that explains how I typically communicate in relationships.`;

    const jsonSchemaString = getStyleJsonSchema();
    const jsonFormatInstructions = `
    Return the values in the following JSON format:
    ${jsonSchemaString}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`;

    return {
        role: 'user',
        content: `${baseContent}${includeJsonFormat ? jsonFormatInstructions : ''}`
    };
};

export const generateUserRelationshipsConflictResolutionStylePrompt = (includeJsonFormat: boolean = true): Prompt => {
    const baseContent = `Based on my combined personality test results, analyze my conflict resolution style.
    Choose one of the following styles: Avoiding, Accommodating, Competitive, Compromising, Collaborating.
    Provide a title and description that explains how I typically handle conflicts in relationships.`;

    const jsonSchemaString = getStyleJsonSchema();
    const jsonFormatInstructions = `
    Return the values in the following JSON format:
    ${jsonSchemaString}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`;

    return {
        role: 'user',
        content: `${baseContent}${includeJsonFormat ? jsonFormatInstructions : ''}`
    };
};

export const generateUserRelationshipsAttachmentStylePrompt = (includeJsonFormat: boolean = true): Prompt => {
    const baseContent = `Based on my combined personality test results, analyze my attachment style.
    Choose one of the following styles: Secure, Anxious, Avoidant, Fearful-Avoidant.
    Provide a title and description that explains how I typically form and maintain emotional bonds in relationships.`;

    const jsonSchemaString = getStyleJsonSchema();
    const jsonFormatInstructions = `
    Return the values in the following JSON format:
    ${jsonSchemaString}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`;

    return {
        role: 'user',
        content: `${baseContent}${includeJsonFormat ? jsonFormatInstructions : ''}`
    };
};

export const userRelationshipsUserContextPrompt = (context: string): Prompt => {
    const prompt = Mustache.render('User Profile and Assessment Context: {{ context }}', { context });
    return { role: 'user', content: prompt };
};

export const retryUserRelationshipsKeyTermsPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please provide a properly formatted JSON response with the following structure:
    ${getKeyTermsJsonSchema()}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`
});

export const retryUserRelationshipsDescriptionPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please provide a properly formatted JSON response with the following structure:
    ${getDescriptionJsonSchema()}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`
});

export const retryUserRelationshipsCommunicationStylePrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please provide a properly formatted JSON response with the following structure:
    ${getStyleJsonSchema()}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`
});

export const retryUserRelationshipsConflictResolutionStylePrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please provide a properly formatted JSON response with the following structure:
    ${getStyleJsonSchema()}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`
});

export const retryUserRelationshipsAttachmentStylePrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please provide a properly formatted JSON response with the following structure:
    ${getStyleJsonSchema()}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`
});