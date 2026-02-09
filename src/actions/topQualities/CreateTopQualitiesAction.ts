import {IUserTopQuality, setQualityColor, setQualityLevel, UserTopQuality} from "@src/models/UserTopQuality";
import {
    generateTopQualitiesPrompt,
    retryTopQualitiesPrompt,
    StrictTopQualitiesResponseSchema,
    TopQualitiesResponseSchema
} from "@src/prompts/TopQualities";
import {LlmModelConfig} from "@src/providers/llm/LlmProvider";
import {err, ok, Result} from "neverthrow";
import {Action} from "../Action";
import {LlmService} from "@src/services/LlmService";

export class CreateTopQualitiesAction implements Action<IUserTopQuality[]> {
    name = "CreateTopQualitiesAction";
    description = "Generate Top Qualities using LLM based on provided context";

    constructor(private llmService: LlmService) {}

    async execute<T = IUserTopQuality[]>(context: string, config?: LlmModelConfig): Promise<Result<T, Error>> {
        console.log("~~~ CreateTopQualitiesAction execute context", context);

        const topQualitiesPrompt = generateTopQualitiesPrompt(!this.llmService.llmProvider?.supportsStructuredOutputs);

        const messages = [
            topQualitiesPrompt,
        ];

        let result: Result<{ entries: Omit<IUserTopQuality, 'color'>[] }, Error>;

        const llmProvider = this.llmService.llmProvider;
        if (!llmProvider) {
            return err(new Error('LLM provider not initialized'));
        }

        if (llmProvider.supportsStructuredOutputs) {
            result = await llmProvider.generateStructuredOutput(messages, TopQualitiesResponseSchema, config);
        } else if (llmProvider.supportsJsonResultOutput) {
            result = await llmProvider.generateJsonSchemaOutput(messages, TopQualitiesResponseSchema, config);
        } else {
            const chatResult = await llmProvider.chat(messages, config);
            if (chatResult.isErr()) {
                return err(chatResult.error);
            }

            let parsed;
            try {
                parsed = JSON.parse(chatResult.value);
            } catch (error) {
                console.log("~~~ CreateTopQualitiesAction execute retrying due to JSON parse error");
                const reformatPrompt = retryTopQualitiesPrompt();
                const reformatResult = await llmProvider.chat([
                    ...messages,
                    { role: 'assistant', content: chatResult.value },
                    reformatPrompt
                ], config);

                if (reformatResult.isErr()) {
                    return err(reformatResult.error);
                }

                try {
                    parsed = JSON.parse(reformatResult.value);
                } catch (error) {
                    return err(error instanceof Error ? error : new Error('Failed to parse top qualities response after retry'));
                }
            }

            const parsedValues = TopQualitiesResponseSchema.safeParse(parsed);
            
            if(!parsedValues.success) {
                console.log("~~~ CreateTopQualitiesAction execute retrying to get properly formatted response");
                const reformatPrompt = retryTopQualitiesPrompt();
                const reformatResult = await llmProvider.chat([
                    ...messages,
                    { role: 'assistant', content: JSON.stringify(parsed) },
                    reformatPrompt
                ], config);

                if (reformatResult.isErr()) {
                    return err(reformatResult.error);
                }

                try {
                    const reparsed = JSON.parse(reformatResult.value);
                    const reparsedValues = TopQualitiesResponseSchema.safeParse(reparsed);
                    
                    if(!reparsedValues.success) {
                        return err(new Error('Failed to get properly formatted top qualities after retry'));
                    }
                    
                    result = ok(reparsedValues.data);
                } catch (error) {
                    return err(error instanceof Error ? error : new Error('Failed to parse top qualities response'));
                }
            } else {
                result = ok(parsedValues.data);
            }
        }

        if (result.isErr()) {
            console.log("~~~ CreateTopQualitiesAction execute error", result.error);
            return err(result.error);
        }

        // Validate against strict schema
        const strictValidation = StrictTopQualitiesResponseSchema.safeParse(result.value);
        if (!strictValidation.success) {
            return err(new Error('Top qualities failed strict validation'));
        }

        // Set quality level and color for each quality
        const processedQualities = result.value.entries.map(quality => {
            const partialQuality: Partial<UserTopQuality> = {
                ...quality,
                color: '', // Will be set by setQualityColor
                id: '', // These fields will be set by the service layer
                user_id: '',
                created_at: '',
                updated_at: ''
            };
            setQualityLevel(partialQuality as UserTopQuality);
            setQualityColor(partialQuality as UserTopQuality);
            return partialQuality as IUserTopQuality;
        });

        return ok(processedQualities as unknown as T);
    }
} 