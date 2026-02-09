import { observable } from "@legendapp/state";
import { AboutYouSectionType, getEntriesBySection, UserAboutYou } from "@src/models/UserAboutYou";
import { ViewModel } from "./ViewModel";
import { injectable } from "tsyringe";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { LlmService } from "@src/services/LlmService";
import Mustache from "mustache";

// Prompt template for generating conversation starter questions
const CONVERSATION_STARTER_PROMPT = `Based on the context "{{context}}", generate a conversation starter question that I (the user) could ask you (the AI) to get insights or advice about myself. 

The question should:
- Be in first-person (starting with "How do I", "What can I", "Why am I", etc.)
- Be simple and clear (one sentence)
- Be directly related to the context provided
- Focus on self-reflection, personal growth, or seeking advice
- Be something I would ask to learn more about myself

Examples of good questions:
- "How can I improve my time management skills?"
- "What might be causing my anxiety about public speaking?"
- "Why do I struggle with setting boundaries in relationships?"`;

@injectable()
export class ExploreConversationStarterViewModel extends ViewModel {
    private llmService = this.addDependency(LlmService);
    constructor() {
        super('ExploreConversationStarterViewModel');
    }
    

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    private async generateQuestions(entries: UserAboutYou[]): Promise<string[]> {
        if (entries.length === 0) return [];

        const llmProvider = this.llmService!.llmProvider;
        if(!llmProvider) {
            return [];
        }
        
        // Select between 1 and 3 random entries
        const numEntries = Math.min(Math.floor(Math.random() * 3) + 1, entries.length);
        const selectedEntries = entries.sort(() => 0.5 - Math.random()).slice(0, numEntries);

        const questions = await Promise.all(selectedEntries.map(async entry => {
            const context = `Title: ${entry.title}, Description: ${entry.description}`;
            
            // Use Mustache to render the prompt template with the context
            const prompt = Mustache.render(CONVERSATION_STARTER_PROMPT, { context });

            const result = await llmProvider.chat([{
                role: 'user',
                content: prompt
            }]);

            // If there's an error, generate a fallback question from the title
            if (result.isErr()) {
                console.error('Error generating question:', result.error);
                return `How can I better understand my ${entry.title.toLowerCase()}?`;
            }

            return result.value;
        }));

        return questions.map(question => question.replace(/^"|"$/g, ''));
    }

    public getSelfAwarenessQuestions$ = observable(async () => {
        const entries = getEntriesBySection(AboutYouSectionType.SELF_AWARENESS);
        return await this.generateQuestions(entries);
    });

    public getRelationshipsQuestions$ = observable(async () => {
        const entries = getEntriesBySection(AboutYouSectionType.RELATIONSHIPS);
        return await this.generateQuestions(entries);
    });

    public getCareerDevelopmentQuestions$ = observable(async () => {
        const entries = getEntriesBySection(AboutYouSectionType.CAREER_DEVELOPMENT);
        return await this.generateQuestions(entries);
    });
} 
