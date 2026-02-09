import { Prompt } from "@src/prompts/Prompt";
import Mustache from "mustache";
import { z } from "zod";

export const ProfessionalDevelopmentSchema = z.object({
    entries: z.object({
        key_terms: z.array(z.string()),
        description: z.string(),
        leadership_style_title: z.string(),
        leadership_style_description: z.string(),
        goal_setting_style_title: z.string(),
        goal_setting_style_description: z.string()
    })
});

export const StrictProfessionalDevelopmentSchema = ProfessionalDevelopmentSchema.extend({
    entries: z.object({
        key_terms: z.array(z.string()).length(5),
        description: z.string().min(1),
        leadership_style_title: z.string().min(1),
        leadership_style_description: z.string().min(1),
        goal_setting_style_title: z.string().min(1),
        goal_setting_style_description: z.string().min(1)
    })
});

const professionalDevelopmentData = {
    entries: {
        key_terms: ["string", "string", "string", "string", "string"],
        description: "string",
        leadership_style_title: "string",
        leadership_style_description: "string",
        goal_setting_style_title: "string",
        goal_setting_style_description: "string"
    }
};

let cachedResult: string | null = null;

function getJsonSchemaString(): string {
    if(cachedResult) {
        return cachedResult;
    }
    const result = ProfessionalDevelopmentSchema.safeParse(professionalDevelopmentData);
    if(!result.success) {
        throw new Error('Invalid professional development data');
    }
    cachedResult = JSON.stringify(result.data, null, 2);
    return cachedResult;
}

export const generateProfessionalDevelopmentPrompt = (): Prompt => ({
    role: 'user',
    content: `Based on my assessments and background information, generate a professional development profile that includes:
1. Generate 5 key terms that represent my strengths in my professional life. Each key term can be either an adjective describing me (e.g., "Innovative") or a noun (e.g., "Strategic thinker"). Use sentence case for each key term.
2. A concise and brief description of my strengths in my professional life. The tone should be forward-looking, encouraging me to continue pursuing excellence. Keep the length to 2 sentences maximum.
3. My leadership style title: Based on my combined personality test results, choose one leadership style from the following: Democratic/Participative, Autocratic/Authoritarian, Laissez-faire/Delegative, Transformational, Transactional
4. Leadership style description: Describe my leadership style in a few sentences.
4. My goal-setting style title: Based on my combined personality test results, choose one goal-setting style from the following: Performance-oriented, Learning-oriented, Avoidance-oriented, Mastery-oriented
5. Goal-setting style description: Describe my goal-setting style in a few sentences.

Format the response as a JSON object with the following structure:
${getJsonSchemaString()}
The response MUST be valid JSON and MUST follow this exact format. Each key term should be meaningful and distinct from the others.
Do not include any other text or comments - this is not markdown
Keep descriptions concise but insightful. Focus on actionable insights and practical implications.`
});

export const professionalDevelopmentUserContextPrompt = (context: string): Prompt => {
    const prompt = Mustache.render('User Assessment Context: {{ context }}', { context });
    return { role: 'user', content: prompt };
};

export const retryProfessionalDevelopmentPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please provide a properly formatted JSON response with the following structure:
${getJsonSchemaString()}
The response MUST be valid JSON and MUST follow this exact format.
Do not include any other text or comments - this is not markdown`
}); 