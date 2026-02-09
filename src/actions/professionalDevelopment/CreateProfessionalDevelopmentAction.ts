import {err, ok, Result} from "neverthrow";
import {Action} from "../Action";
import {ILlmProvider, LlmMessage, LlmModelConfig} from "@src/providers/llm/LlmProvider";
import {
    generateProfessionalDevelopmentPrompt,
    ProfessionalDevelopmentSchema,
    retryProfessionalDevelopmentPrompt,
    StrictProfessionalDevelopmentSchema
} from "@src/prompts/ProfessionalDevelopment";

export interface ProfessionalDevelopmentLlmResponse {
    key_terms: string[];
    description: string;
    leadership_style_title: string;
    leadership_style_description: string;
    goal_setting_style_title: string;
    goal_setting_style_description: string;
}

export class CreateProfessionalDevelopmentAction implements Action<ProfessionalDevelopmentLlmResponse> {
    name = "CreateProfessionalDevelopmentAction";
    description = "Generate professional development using LLM based on provided context";

    constructor(private llmProvider: ILlmProvider) {}

    private async parseAndValidateResponse(response: string): Promise<Result<ProfessionalDevelopmentLlmResponse, Error>> {
        try {
            const parsed = JSON.parse(response);
            const parsedValues = ProfessionalDevelopmentSchema.safeParse(parsed);
            
            if (!parsedValues.success) {
                return err(new Error('Failed to validate professional development response'));
            }
            
            return ok(parsedValues.data.entries);
        } catch (error) {
            console.log("~~~ CreateProfessionalDevelopmentAction parseAndValidateResponse error", error);
            return err(error instanceof Error ? error : new Error('Failed to parse professional development response'));
        }
    }

    async execute<T = ProfessionalDevelopmentLlmResponse>(context: string, config?: LlmModelConfig): Promise<Result<T, Error>> {
        console.log("~~~ CreateProfessionalDevelopmentAction execute context", context);

        const profDevPrompt = generateProfessionalDevelopmentPrompt();

        const messages: LlmMessage[] = [
            profDevPrompt
        ];

        let result: Result<ProfessionalDevelopmentLlmResponse, Error>;

        if (this.llmProvider.supportsStructuredOutputs) {
            const structuredResult = await this.llmProvider.generateStructuredOutput(messages, ProfessionalDevelopmentSchema, config);
            result = structuredResult.isErr() ? err(structuredResult.error) : ok(structuredResult.value.entries);
        } else if (this.llmProvider.supportsJsonResultOutput) {
            const jsonResult = await this.llmProvider.generateJsonSchemaOutput(messages, ProfessionalDevelopmentSchema, config);
            result = jsonResult.isErr() ? err(jsonResult.error) : ok(jsonResult.value.entries);
        } else {
            const chatResult = await this.llmProvider.chat(messages, config);
            if (chatResult.isErr()) {
                return err(chatResult.error);
            }

            result = await this.parseAndValidateResponse(chatResult.value);
            
            if (result.isErr()) {
                console.log("~~~ CreateProfessionalDevelopmentAction execute retrying to get properly formatted response");
                const reformatPrompt = retryProfessionalDevelopmentPrompt();
                console.log("~~~ CreateProfessionalDevelopmentAction execute retrying: ", reformatPrompt);
                
                const reformatResult = await this.llmProvider.chat([
                    ...messages,
                    {
                        role: 'assistant',
                        content: chatResult.value
                    },
                    reformatPrompt
                ], config);

                if (reformatResult.isErr()) {
                    console.log("~~~ CreateProfessionalDevelopmentAction execute retrying error", reformatResult.error);
                    return err(reformatResult.error);
                }

                console.log("~~~ CreateProfessionalDevelopmentAction execute retrying got response", reformatResult.value);
                result = await this.parseAndValidateResponse(reformatResult.value);
            }
        }

        if (result.isErr()) {
            console.log("~~~ CreateProfessionalDevelopmentAction execute error", result.error);
            return err(result.error);
        }

        // Validate against strict schema
        const strictValidation = StrictProfessionalDevelopmentSchema.safeParse({ entries: result.value });
        if (!strictValidation.success) {
            return err(new Error('Professional development failed strict validation'));
        }

        return ok(result.value as unknown as T);
    }
} 