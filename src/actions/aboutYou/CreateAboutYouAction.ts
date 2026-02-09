import {err, ok, Result} from "neverthrow";
import {Action} from "../Action";
import {ILlmProvider, LlmMessage, LlmModelConfig} from "@src/providers/llm/LlmProvider";
import {AboutYouSectionType} from "@src/models/UserAboutYou";
import {
    AboutYouEntriesResponseSchema,
    generateAboutYouPrompt,
    retryAboutYouPrompt,
    StrictAboutYouEntriesResponseSchema
} from "@src/prompts/AboutYouPrompts";
import {z} from "zod";

export interface AboutYouEntry {
    title: string;
    description: string;
}

type AboutYouEntriesResponse = z.infer<typeof AboutYouEntriesResponseSchema>;

export class CreateAboutYouAction implements Action<AboutYouEntry[]> {
    name = "CreateAboutYouAction";
    description = "Generate about you entries using LLM based on provided context";

    constructor(
        private llmProvider: ILlmProvider,
        private sectionType: AboutYouSectionType
    ) {}

    async execute<T = AboutYouEntry[]>(context: string, config?: LlmModelConfig): Promise<Result<T, Error>> {
        const aboutYouPrompt = generateAboutYouPrompt(this.sectionType, !this.llmProvider.supportsStructuredOutputs);

        const messages: LlmMessage[] = [
            aboutYouPrompt,
        ];

        let result: Result<AboutYouEntry[], Error>;

        if(this.llmProvider.supportsStructuredOutputs) {
            const structuredResult = await this.llmProvider.generateStructuredOutput<AboutYouEntriesResponse>(messages, AboutYouEntriesResponseSchema, config);
            result = structuredResult.map((response) => response.entries);
        } else if(this.llmProvider.supportsJsonResultOutput) {
            const jsonResult = await this.llmProvider.generateJsonSchemaOutput<AboutYouEntriesResponse>(messages, AboutYouEntriesResponseSchema, config);
            result = jsonResult.map((response) => response.entries);
        } else {
            const chatResult = await this.llmProvider.chat(messages, config);
            if(chatResult.isErr()) {
                return err(chatResult.error);
            }
            result = await this.parseAboutYouEntries(chatResult.value, messages, config);
        }

        if (result.isErr()) {
            return err(result.error);
        }

        // Validate entries against strict schema
        const strictValidation = StrictAboutYouEntriesResponseSchema.safeParse({ entries: result.value });
        if (!strictValidation.success) {
            return err(new Error('About you entries failed strict validation'));
        }

        return ok(result.value as unknown as T);
    }

    private async parseAboutYouEntries(result: string, messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<AboutYouEntry[], Error>> {
        try {
            const parsedEntry = AboutYouEntriesResponseSchema.safeParse(JSON.parse(result));
    
            if(!parsedEntry.success) {
                console.log("~~~ CreateAboutYouAction execute chat error parsing response");
                throw new Error('Invalid about you entries response');
            }
    
            return ok(parsedEntry.data.entries);
        } catch (error) {
            try {
                console.log("~~~ CreateAboutYouAction execute retrying to get properly formatted response");
                const reformatPrompt = retryAboutYouPrompt();
                const reformatResult = await this.llmProvider.chat([
                    ...messages,
                    {
                        role: 'assistant',
                        content: result
                    },
                    reformatPrompt
                ], config);
    
                if (reformatResult.isErr()) {
                    return err(reformatResult.error);
                }
    
                const parsedEntry = AboutYouEntriesResponseSchema.safeParse(JSON.parse(reformatResult.value));
                if(!parsedEntry.success) {
                    return err(new Error('Failed to get properly formatted about you entries after retry'));
                }
                return ok(parsedEntry.data.entries);
            }
            catch (error) {
                return err(error instanceof Error ? error : new Error('Failed to parse about you entries response'));
            }
        }
    }
} 