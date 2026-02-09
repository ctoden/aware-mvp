import { Prompt } from "@src/prompts/Prompt";
import Mustache from "mustache";

export const generateEmojiPrompt = (text: string): Prompt => ({
    role: 'user',
    content: Mustache.render(`You are an emoji generator. Provide a single emoji to best represent the following:
"{{text}}"

Only provide a single emoji and only the emoji, no other text or explanation.`, { text })
});

export const generateSummaryPrompt = (text: string): Prompt => ({
    role: 'user',
    content: Mustache.render(`You are a message summarizer. Create a 1-3 word summary that captures the key topic or intent of the following message:
"{{text}}"

Provide only the summary words - no other text, explanation or punctuation. Keep it concise but meaningful.`, { text })
});


