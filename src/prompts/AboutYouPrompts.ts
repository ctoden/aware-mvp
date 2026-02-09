import { AboutYouSectionType } from "@src/models/UserAboutYou";
import { Prompt } from "@src/prompts/Prompt";
import { getUserContextFromModels, LlmMessageBuilderService } from "@src/services/LlmMessageBuilderService";
import { isEmpty } from "lodash";
import Mustache from "mustache";
import { z } from 'zod';

export const AboutYouEntrySchema = z.object({
    title: z.string(),
    description: z.string()
});

export const AboutYouEntriesResponseSchema = z.object({
    entries: z.array(AboutYouEntrySchema)
});

export const StrictAboutYouEntrySchema = AboutYouEntrySchema.extend({
    title: z.string().max(50)
});

export const StrictAboutYouEntriesResponseSchema = z.object({
    entries: z.array(StrictAboutYouEntrySchema).length(5)
});

const aboutYouData = {
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
    const result = AboutYouEntriesResponseSchema.safeParse(aboutYouData);
    if(!result.success) {
        throw new Error('Invalid about you entries data');
    }
    cachedResult = JSON.stringify(result.data, null, 2);
    return cachedResult;
}

export const generateAboutYouPrompt = (sectionType: AboutYouSectionType, includeJsonFormat: boolean = true): Prompt => {
    const prompts = {
        [AboutYouSectionType.SELF_AWARENESS]: `Generate 5 unique brief descriptions of my approach to building and maintaining relationships. 
        For each entry, highlight my communication style, level of empathy, and/or conflict resolution strategies. Keep each description to 2 sentences maximum.
        Title should be less that 50 characters.`,
        [AboutYouSectionType.RELATIONSHIPS]: `Generate 5 unique blind spots, weaknesses, or areas of opportunity for improvement for me related 
        to how they show up in interpersonal relationships. Generate unique and personalized "relationship insights" for the user's profile.
        Each insight should be constructive and offer the kind of "tough love" advice you might receive from a close friend who knows you really well.
        Title should be less that 50 characters.`,
        [AboutYouSectionType.CAREER_DEVELOPMENT]: `Based on my combined personality test results, generate 5 unique analyses of my communication style
        and provide insights about my career development potential. Focus on how my communication style impacts my professional growth.
        Title should be less that 50 characters.`,
    };

    const jsonSchemaString = getJsonSchemaString();
    const jsonFormatInstructions = `
    Return the values in the following JSON format:
    ${jsonSchemaString}
    The response MUST be valid JSON and MUST follow this exact format.`;

    return {
        role: 'user',
        content: `${prompts[sectionType]}${includeJsonFormat ? jsonFormatInstructions : ''}`
    };
};

export const generateInsightArticlePrompt = (sectionType: AboutYouSectionType, title: string, description: string): Prompt => {
    const promptTemplate = 
`Based on the background information I've provided you about me, please generate a mobile app article with the following parameters:
{{sectionType}}, {{title}}, {{description}}

Return the content in the following JSON structure:

{
    "metadata": {
        "sectionType": "{{sectionType}}",
        "title": "{{title}}",
        "summary": "{{description}}"
    },
    "content": {
        "introduction": {
            "text": "[engaging opening paragraph that hooks the reader]"
        },
        "sections": [
            {
                "heading": "[first section heading]",
                "content": "[first section paragraph with actionable advice]"
            },
            {
                "heading": "[second section heading]",
                "content": "[second section paragraph with actionable advice]"
            },
            {
                "heading": "[third section heading]",
                "content": "[third section paragraph with actionable advice]"
            }
        ]
    }
}

Style guidelines:
- Maintain a conversational, friendly tone
- Offer constructive "tough love" advice as if coming from a trusted mentor
- Include practical, actionable steps
- Address potential blind spots and growth opportunities
- Keep paragraphs concise and mobile-friendly
- Ensure content aligns with the {{sectionType}} theme
- Target length: 300-400 words total across all sections
- Each section paragraph should be 2-3 sentences
- Section headings should be brief and compelling
- Use 'you', 'your' and 'yourself' type language

The content should feel personal and tailored while remaining professional and insightful. Focus on empowering the reader with specific strategies for improvement in the context of {{sectionType}}.

`;
    const prompt = Mustache.render(promptTemplate, { title, description, sectionType });
    return {
        role: 'user',
        content: prompt
    };
};

export const retryAboutYouPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please format the response as a JSON object with an "entries" array containing exactly 5 objects, 
    each with a "title" (max 25 chars) and "description" field. The response should look exactly like this:
    {
        "entries": [
            {
                "title": "string",
                "description": "string"
            }
        ]
    }`
}); 