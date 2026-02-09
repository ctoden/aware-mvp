import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { ILlmProvider, LlmMessage, LlmModelConfig } from "@src/providers/llm/LlmProvider";
import { IDigDeeperQuestion } from "@src/models/DigDeeperQuestion";
import { 
    PromptContext, 
    generateDigDeeperPrompt, 
    formatUserContext, 
    formatPreviousQuestions,
    DigDeeperQuestionsSchema,
    StrictDigDeeperQuestionsSchema,
    retryDigDeeperPrompt
} from "@src/prompts/digDeeperPromptTemplate";

export class CreateDigDeeperQuestionsAction implements Action<IDigDeeperQuestion[]> {
    name = "CreateDigDeeperQuestionsAction";
    description = "Generate dig deeper questions using LLM based on user context and previous questions";

    constructor(private llmProvider: ILlmProvider) {}

    async execute<T = IDigDeeperQuestion[]>(
        userContextOrPromptContext: PromptContext,
        config?: LlmModelConfig
    ): Promise<Result<T, Error>> {
        if(!userContextOrPromptContext.userContext.topQualities || userContextOrPromptContext.userContext.topQualities?.length === 0) {
            return err(new Error('No top qualities found in user context. Cannot generate questions.'));
        }
        try {
            const userContextString = formatUserContext(userContextOrPromptContext.userContext);
            const previousQuestionsString = formatPreviousQuestions(userContextOrPromptContext.previousQuestions);

            const contextMessage: LlmMessage = {
                role: 'user',
                content: `Context about the user:\n${userContextString}\n\nPreviously asked questions (DO NOT repeat these or ask similar variations):\n${previousQuestionsString}`
            };

            const promptMessage = generateDigDeeperPrompt(userContextOrPromptContext, !this.llmProvider.supportsStructuredOutputs);

            let result: Result<{ entries: IDigDeeperQuestion[] }, Error>;

            if (this.llmProvider.supportsStructuredOutputs) {
                result = await this.llmProvider.generateStructuredOutput([contextMessage, promptMessage], DigDeeperQuestionsSchema, config);
            } else if (this.llmProvider.supportsJsonResultOutput) {
                result = await this.llmProvider.generateJsonSchemaOutput([contextMessage, promptMessage], DigDeeperQuestionsSchema, config);
            } else {
                const chatResult = await this.llmProvider.chat([contextMessage, promptMessage], config);
                if (chatResult.isErr()) {
                    return err(chatResult.error);
                }
                result = await this.parseQuestions(chatResult.value);
            }

            if (result.isErr()) {
                return err(result.error);
            }

            const validationResult = DigDeeperQuestionsSchema.safeParse(result.value);
            if (!validationResult.success) {
                const retryMessage = retryDigDeeperPrompt();
                const retryResult = await this.llmProvider.generateStructuredOutput(
                    [contextMessage, promptMessage, retryMessage],
                    DigDeeperQuestionsSchema,
                    config
                );

                if (retryResult.isErr()) {
                    return err(retryResult.error);
                }

                const strictValidation = StrictDigDeeperQuestionsSchema.safeParse(retryResult.value);
                if (!strictValidation.success) {
                    return err(new Error('Failed to get valid questions after retry'));
                }

                return ok(strictValidation.data.entries as unknown as T);
            }

            const strictValidation = StrictDigDeeperQuestionsSchema.safeParse(result.value);
            if (!strictValidation.success) {
                return err(new Error('Questions validation failed'));
            }

            return ok(strictValidation.data.entries as unknown as T);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate dig deeper questions'));
        }
    }

    private async parseQuestions(result: string): Promise<Result<{ entries: IDigDeeperQuestion[] }, Error>> {
        try {
            const parsedQuestions = DigDeeperQuestionsSchema.safeParse(JSON.parse(result));
            if (!parsedQuestions.success) {
                return err(new Error('Invalid questions response format'));
            }
            return ok(parsedQuestions.data);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to parse questions response'));
        }
    }
} 