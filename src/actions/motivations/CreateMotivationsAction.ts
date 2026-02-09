import {err, ok, Result} from "neverthrow";
import {Action} from "../Action";
import {ILlmProvider, LlmMessage, LlmModelConfig} from "@src/providers/llm/LlmProvider";
import {IMotivation} from "@src/models/UserMotivation";
import {
    generateMotivationsPrompt,
    MotivationsResponseSchema,
    retryMotivationsPrompt,
    StrictMotivationsResponseSchema
} from "@src/prompts/Motivations";

export class CreateMotivationsAction implements Action<IMotivation[]> {
    name = "CreateMotivationsAction";
    description = "Generate motivations using LLM based on provided context";

    constructor(private llmProvider: ILlmProvider) {}

    async execute<T = IMotivation[]>(context: string, config?: LlmModelConfig): Promise<Result<T, Error>> {
        console.log("~~~ CreateMotivationsAction execute context", context);

        const motivationsPrompt = generateMotivationsPrompt(!this.llmProvider.supportsStructuredOutputs);

        const messages: LlmMessage[] = [
            motivationsPrompt
        ];

        let result: Result<{ entries: IMotivation[] }, Error>;

        if(this.llmProvider.supportsStructuredOutputs) {
            result = await this.llmProvider.generateStructuredOutput(messages, MotivationsResponseSchema, config);
        } else if(this.llmProvider.supportsJsonResultOutput) {
            const jsonResult = await this.llmProvider.generateJsonSchemaOutput(messages, MotivationsResponseSchema, config);
            result = jsonResult.isErr() ? err(jsonResult.error) : ok(jsonResult.value);
        } else {
            const chatResult = await this.llmProvider.chat(messages, config);
            if(chatResult.isErr()) {
                return err(chatResult.error);
            }

            let parsed;
            try {
                parsed = JSON.parse(chatResult.value);
            } catch (error) {
                console.log("~~~ CreateMotivationsAction execute retrying due to JSON parse error");
                const reformatPrompt = retryMotivationsPrompt();
                const reformatResult = await this.llmProvider.chat([
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
                    return err(error instanceof Error ? error : new Error('Failed to parse motivations response after retry'));
                }
            }

            const parsedValues = MotivationsResponseSchema.safeParse(parsed);
            
            if(!parsedValues.success) {
                console.log("~~~ CreateMotivationsAction execute retrying to get properly formatted response");
                const reformatPrompt = retryMotivationsPrompt();
                const reformatResult = await this.llmProvider.chat([
                    ...messages,
                    { role: 'assistant', content: chatResult.value },
                    reformatPrompt
                ], config);

                if (reformatResult.isErr()) {
                    return err(reformatResult.error);
                }

                try {
                    const reparsed = JSON.parse(reformatResult.value);
                    const reparsedValues = MotivationsResponseSchema.safeParse(reparsed);
                    
                    if(!reparsedValues.success) {
                        return err(new Error('Failed to get properly formatted motivations after retry'));
                    }
                    
                    result = ok(reparsedValues.data);
                } catch (error) {
                    return err(error instanceof Error ? error : new Error('Failed to parse motivations response'));
                }
            } else {
                result = ok(parsedValues.data);
            }
        }

        if (result.isErr()) {
            console.log("~~~ CreateMotivationsAction execute error", result.error);
            return err(result.error);
        }

        // Validate against strict schema
        const strictValidation = StrictMotivationsResponseSchema.safeParse(result.value);
        if (!strictValidation.success) {
            return err(new Error('Motivations failed strict validation'));
        }

        return ok(result.value.entries as unknown as T);
    }
} 