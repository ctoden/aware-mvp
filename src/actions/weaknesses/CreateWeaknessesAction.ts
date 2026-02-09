import {err, ok, Result} from "neverthrow";
import {Action} from "../Action";
import {ILlmProvider, LlmMessage, LlmModelConfig} from "@src/providers/llm/LlmProvider";
import {IWeakness} from "@src/models/UserWeakness";
import {
    generateWeaknessesPrompt,
    retryWeaknessesPrompt,
    StrictWeaknessesResponseSchema,
    WeaknessesResponseSchema
} from "@src/prompts/Weaknesses";

export class CreateWeaknessesAction implements Action<IWeakness[]> {
    name = "CreateWeaknessesAction";
    description = "Generate weaknesses using LLM based on provided context";

    constructor(private llmProvider: ILlmProvider) {}

    async execute<T = IWeakness[]>(context: string, config?: LlmModelConfig): Promise<Result<T, Error>> {
        console.log("~~~ CreateWeaknessesAction execute context", context);

        const weaknessesPrompt = generateWeaknessesPrompt(!this.llmProvider.supportsStructuredOutputs);
        const messages: LlmMessage[] = [
            weaknessesPrompt
        ];

        let result: Result<{ entries: IWeakness[] }, Error>;

        if (this.llmProvider.supportsStructuredOutputs) {
            result = await this.llmProvider.generateStructuredOutput(messages, WeaknessesResponseSchema, config);
        } else if (this.llmProvider.supportsJsonResultOutput) {
            result = await this.llmProvider.generateJsonSchemaOutput(messages, WeaknessesResponseSchema, config);
        } else {
            const chatResult = await this.llmProvider.chat(messages, config);
            if (chatResult.isErr()) {
                return err(chatResult.error);
            }

            let parsed;
            try {
                parsed = JSON.parse(chatResult.value);
            } catch (error) {
                console.log("~~~ CreateWeaknessesAction execute retrying due to JSON parse error");
                const reformatPrompt = retryWeaknessesPrompt();
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
                    return err(error instanceof Error ? error : new Error('Failed to parse weaknesses response after retry'));
                }
            }

            const parsedValues = WeaknessesResponseSchema.safeParse(parsed);
            
            if(!parsedValues.success) {
                console.log("~~~ CreateWeaknessesAction execute retrying to get properly formatted response");
                const reformatPrompt = retryWeaknessesPrompt();
                const reformatResult = await this.llmProvider.chat([
                    ...messages,
                    { role: 'assistant', content: JSON.stringify(parsed) },
                    reformatPrompt
                ], config);

                if (reformatResult.isErr()) {
                    return err(reformatResult.error);
                }

                try {
                    const reparsed = JSON.parse(reformatResult.value);
                    const reparsedValues = WeaknessesResponseSchema.safeParse(reparsed);
                    
                    if(!reparsedValues.success) {
                        return err(new Error('Failed to get properly formatted weaknesses after retry'));
                    }
                    
                    result = ok(reparsedValues.data);
                } catch (error) {
                    return err(error instanceof Error ? error : new Error('Failed to parse weaknesses response'));
                }
            } else {
                result = ok(parsedValues.data);
            }
        }

        if (result.isErr()) {
            console.log("~~~ CreateWeaknessesAction execute error", result.error);
            return err(result.error);
        }

        // Validate against strict schema
        const strictValidation = StrictWeaknessesResponseSchema.safeParse(result.value);
        if (!strictValidation.success) {
            return err(new Error('Weaknesses failed strict validation'));
        }

        return ok(result.value.entries as unknown as T);
    }
} 