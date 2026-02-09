import {err, ok, Result} from "neverthrow";
import {AssessmentBasedAction} from "../AssessmentBasedAction";
import {ILlmProvider, LlmMessage} from "@src/providers/llm/LlmProvider";
import {UserAssessment} from "@src/models/UserAssessment";
import {
    generateUserQuickInsightPrompt,
    retryUserQuickInsightPrompt,
    StrictUserQuickInsightResponseSchema,
    UserQuickInsightResponseSchema
} from "@src/prompts/UserQuickInsights";

export class CreateUserQuickInsightAction extends AssessmentBasedAction<string> {
    name = "CreateUserQuickInsightAction";
    description = "Generate user quick insights using LLM based on assessment context";

    constructor(private llmProvider: ILlmProvider) {
        super();
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<string, Error>> {
        if (assessments.length === 0) {
            return ok("No new assessments to process");
        }

        const insightPrompt = generateUserQuickInsightPrompt(!this.llmProvider.supportsStructuredOutputs);

        const messages: LlmMessage[] = [
            insightPrompt,
        ];

        let result: Result<{ entries: { title: string, description: string } }, Error>;

        if (this.llmProvider.supportsStructuredOutputs) {
            result = await this.llmProvider.generateStructuredOutput(messages, UserQuickInsightResponseSchema);
        } else if (this.llmProvider.supportsJsonResultOutput) {
            result = await this.llmProvider.generateJsonSchemaOutput(messages, UserQuickInsightResponseSchema);
        } else {
            const chatResult = await this.llmProvider.chat(messages);
            if (chatResult.isErr()) {
                return err(chatResult.error);
            }

            let parsed;
            try {
                parsed = JSON.parse(chatResult.value);
            } catch (error) {
                console.log("~~~ CreateUserQuickInsightAction execute retrying due to JSON parse error");
                const reformatPrompt = retryUserQuickInsightPrompt();
                const reformatResult = await this.llmProvider.chat([
                    ...messages,
                    { role: 'assistant', content: chatResult.value },
                    reformatPrompt
                ]);

                if (reformatResult.isErr()) {
                    return err(reformatResult.error);
                }

                try {
                    parsed = JSON.parse(reformatResult.value);
                } catch (error) {
                    return err(error instanceof Error ? error : new Error('Failed to parse quick insight response after retry'));
                }
            }

            const parsedValues = UserQuickInsightResponseSchema.safeParse(parsed);
            
            if(!parsedValues.success) {
                console.log("~~~ CreateUserQuickInsightAction execute retrying to get properly formatted response");
                const reformatPrompt = retryUserQuickInsightPrompt();
                const reformatResult = await this.llmProvider.chat([
                    ...messages,
                    { role: 'assistant', content: JSON.stringify(parsed) },
                    reformatPrompt
                ]);

                if (reformatResult.isErr()) {
                    return err(reformatResult.error);
                }

                try {
                    const reparsed = JSON.parse(reformatResult.value);
                    const reparsedValues = UserQuickInsightResponseSchema.safeParse(reparsed);
                    
                    if(!reparsedValues.success) {
                        return err(new Error('Failed to get properly formatted quick insight after retry'));
                    }
                    
                    result = ok(reparsedValues.data);
                } catch (error) {
                    return err(error instanceof Error ? error : new Error('Failed to parse quick insight response'));
                }
            } else {
                result = ok(parsedValues.data);
            }
        }

        if (result.isErr()) {
            return err(result.error);
        }

        // Validate against strict schema
        const strictValidation = StrictUserQuickInsightResponseSchema.safeParse(result.value);
        if (!strictValidation.success) {
            return err(new Error('Quick insight failed strict validation'));
        }

        return ok(`${result.value.entries.title}|${result.value.entries.description}`);
    }
} 