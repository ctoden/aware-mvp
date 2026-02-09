import {Prompt} from "@src/prompts/Prompt";
import { template } from "lodash";

export const generateProfileSummaryPrompt = (): Prompt => ({
    role: 'user',
    content: `Generate a concise, professional, and slightly motivational summary for 
        my profile and background. The summary should synthesize key insights from my personality test results.
        Highlight my core strengths, motivations, and overall approach to life, emphasizing positive aspects
        of my personality. The tone should be empowering and encouraging, giving me a sense of clarity and
        confidence about my unique qualities. Keep the length to 4 sentences maximum. Word it as if you are speaking
        to me directly and not as if you are a chatbot. Do not include any other information in the summary; Do not include
        disclaimers or other information that is not relevant to my profile. I understand I am working with
        a chatbot and have read the disclaimers.`
});