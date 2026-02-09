import { z } from 'zod';
import { Prompt } from "@src/prompts/Prompt";
import { DigDeeperQuestionType, DigDeeperQuestionStatus } from "@src/models/DigDeeperQuestion";

export const DigDeeperQuestionSchema = z.object({
    question: z.string(),
    question_type: z.enum([DigDeeperQuestionType.ONBOARDING_DATA, DigDeeperQuestionType.PERSONALITY_INSIGHTS]),
    context: z.string(),
    status: z.literal(DigDeeperQuestionStatus.PENDING)
});

export const DigDeeperQuestionsSchema = z.object({
    entries: z.array(DigDeeperQuestionSchema)
});

export const StrictDigDeeperQuestionSchema = DigDeeperQuestionSchema.extend({
    question: z.string().min(10),
    context: z.string().min(10)
});

export const StrictDigDeeperQuestionsSchema = DigDeeperQuestionsSchema.extend({
    entries: z.array(StrictDigDeeperQuestionSchema).length(3)
});

const digDeeperQuestionsData = {
    entries: [
        {
            question: "What specific skills or experiences do you want to gain in your next role?",
            question_type: DigDeeperQuestionType.ONBOARDING_DATA,
            context: "Understanding career development goals",
            status: DigDeeperQuestionStatus.PENDING
        },
        {
            question: "How do you prefer to receive feedback on your work?",
            question_type: DigDeeperQuestionType.PERSONALITY_INSIGHTS,
            context: "Understanding communication preferences",
            status: DigDeeperQuestionStatus.PENDING
        },
        {
            question: "What type of work environment helps you feel most energized?",
            question_type: DigDeeperQuestionType.PERSONALITY_INSIGHTS,
            context: "Understanding workplace preferences",
            status: DigDeeperQuestionStatus.PENDING
        }
    ]
};

let cachedResult: string | null = null;

function getJsonSchemaString(): string {
    if (cachedResult) {
        return cachedResult;
    }
    const result = DigDeeperQuestionsSchema.safeParse(digDeeperQuestionsData);
    if (!result.success) {
        throw new Error('Invalid dig deeper questions data');
    }
    cachedResult = JSON.stringify(result.data, null, 2);
    return cachedResult;
}

export const generateDigDeeperPrompt = (context: PromptContext, includeJsonFormat: boolean = true): Prompt => {
    const backgroundStrTemplate = `
Additional context about the me:
{{userContext}}

Previously questions you have asked me (DO NOT repeat these or ask similar variations):
{{previousQuestions}}
`;

    const userContextString = formatUserContext(context.userContext);
    const previousQuestionsString = formatPreviousQuestions(context.previousQuestions);

    const backgroundStr = backgroundStrTemplate
        .replace('{{userContext}}', userContextString)
        .replace('{{previousQuestions}}', previousQuestionsString);

    const baseContent = `You are an expert career coach and personal development mentor. 
Your task is to generate 3 insightful questions that will help me better understand my career situation and
personal motivations.

Guidelines for generating questions:
1. Generate exactly 3 questions
2. Each question should be unique and not semantically similar to previously asked questions
3. Questions should be a mix of:
   - Missing onboarding data (career goals, current role, skills)
   - Personal insights (motivations, fears, aspirations)
4. Questions should be:
   - Open-ended
   - Focused on depth rather than surface-level information
   - Empathetic and professional in tone
   - Impossible to answer with just yes/no
   - Building upon known information to dig deeper`;

    const jsonSchemaString = getJsonSchemaString();
    const jsonFormatInstructions = `
    Return the values in the following JSON format:
    ${jsonSchemaString}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`;

    return {
        role: 'user',
        content: `${baseContent}${includeJsonFormat ? jsonFormatInstructions : ''}\n\n${backgroundStr}`
    };
};

export const retryDigDeeperPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please provide a properly formatted JSON response with the following structure:
    ${getJsonSchemaString()}
    The response MUST be valid JSON and MUST follow this exact format.
    Do not include any other text or comments - this is not markdown`
});

export interface PromptContext {
    userContext: {
        name: string;
        personalityData: string[];
        currentRole?: string;
        longTermGoals?: string[];
        shortTermGoals?: string[];
        topQualities?: string[];
        weaknesses?: string[];
        coreValues?: string[];
        interests?: string[];
        motivations?: string[];
        innerCircle?: string[];
    };
    previousQuestions: {
        question: string;
        status: 'ANSWERED' | 'SKIPPED';
    }[];
}

export function formatUserContext(context: PromptContext['userContext']): string {
    const contextParts: string[] = [];
    
    if (context.name) {
        contextParts.push(`Name: ${context.name}`);
    }
    if (context.currentRole) {
        contextParts.push(`Current Role: ${context.currentRole}`);
    }
    if (context.longTermGoals?.length) {
        contextParts.push(`Long Term Goals: ${context.longTermGoals.join(', ')}`);
    }
    if (context.shortTermGoals?.length) {
        contextParts.push(`Short Term Goals: ${context.shortTermGoals.join(', ')}`);
    }
    if (context.topQualities?.length) {
        contextParts.push(`Skills: ${context.topQualities.join(', ')}`);
    }
    if (context.weaknesses?.length) {
        contextParts.push(`Identified Weaknesses: ${context.weaknesses.join(', ')}`);
    }
    if (context.coreValues?.length) {
        contextParts.push(`Core Values: ${context.coreValues.join(', ')}`);
    }
    if (context.interests?.length) {
        contextParts.push(`Interests: ${context.interests.join(', ')}`);
    }
    if (context.motivations?.length) {
        contextParts.push(`Motivations: ${context.motivations.join(', ')}`);
    }
    if (context.innerCircle?.length) {
        contextParts.push(`Inner Circle: ${context.innerCircle.join(', ')}`);
    }
    if (context.personalityData.length) {
        contextParts.push(`Personality Assessment Data: ${context.personalityData.join('\n')}`);
    }

    return contextParts.length > 0 ? contextParts.join('\n') : 'Limited user information available.';
}

export function formatPreviousQuestions(questions: PromptContext['previousQuestions']): string {
    if (!questions.length) {
        return 'No previous questions asked.';
    }

    return questions
        .map(q => `Question: "${q.status}" - "${q.question}"`)
        .join('\n\n');
}

// # Prompt for Generating "Dig Deeper" Questions

// Generate 3 "Dig Deeper" questions for a user based on the following data:

// ## User Data
// - `id`: "user123"
// - `email`: null
// - `phoneNumber`: null

// ## Personality Data
// - `openness`: 45

// Ensure that the questions are tailored to missing onboarding data and personality-related data. 
// Do not generate questions that the user has already answered or skipped. 
// The questions should be in the format of the `DigDeeperQuestion` interface, 
//including a unique `id`, `user_id`, `created_at`, `updated_at`, and `status` set to `PENDING`.

// ## Example Output
