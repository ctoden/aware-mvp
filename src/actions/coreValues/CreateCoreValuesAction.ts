import {err, ok, Result} from "neverthrow";
import {Action} from "../Action";
import {ILlmProvider, LlmMessage, LlmModelConfig} from "@src/providers/llm/LlmProvider";
import {ICoreValue} from "@src/models/UserCoreValue";
import {CoreValueSchema, generateCoreValuesPrompt, retryCoreValuesPrompt} from "@src/prompts/CoreValues";
import {CoreValuesActionService} from "@src/actions/coreValues/CoreValuesActionService.interface";

export class CreateCoreValuesAction implements Action<ICoreValue[]> {
    name = "CreateCoreValuesAction";
    description = "Generate core values using LLM based on provided context";

    constructor(protected llmProvider: ILlmProvider, protected coreValuesActionService: CoreValuesActionService) {}

    async execute<T = ICoreValue[]>(context: string, config?: LlmModelConfig): Promise<Result<T, Error>> {
        // console.log("~~~ CreateCoreValuesAction execute context", context);

        const coreValuesPrompt = generateCoreValuesPrompt(!this.llmProvider.supportsStructuredOutputs);

        const messages: LlmMessage[] = [
            coreValuesPrompt,
        ];

        let result: Result<ICoreValue[], Error>;

        if(this.llmProvider.supportsStructuredOutputs) {
            const structuredResult = await this.llmProvider.generateStructuredOutput(messages, CoreValueSchema, config);
            result = structuredResult.map(response => response.core_values);
        } else if(this.llmProvider.supportsJsonResultOutput) {
            const jsonResult = await this.llmProvider.generateJsonSchemaOutput(messages, CoreValueSchema, config);
            result = jsonResult.map(response => response.core_values);
        } else {
            const chatResult = await this.llmProvider.chat(messages, config);
            if(chatResult.isErr()) {
                return err(chatResult.error);
            }
            result = await this.parseCoreValues(chatResult.value, messages, config);
        }

        if (result.isErr()) {
            console.log("~~~ CreateCoreValuesAction execute chat error", result.error);
            return err(result.error);
        }

        // Create core values using batch service method
        const createdValuesResult = await this.coreValuesActionService.createCoreValues(result.value);
        
        if (createdValuesResult.isErr()) {
            return err(createdValuesResult.error);
        }
        
        // console.log("~~~ CreateCoreValuesAction execute chat success", result.value);

        return ok(result.value as unknown as T);
    }

    async parseCoreValues(result: string, messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<ICoreValue[], Error>> {
        try {
            const parsed = JSON.parse(result);
            const parsedValues = CoreValueSchema.safeParse(parsed);
    
            if(!parsedValues.success) {
                return await this.retryWithReformatPrompt(result, messages, config);
            }
    
            return ok(parsedValues.data.core_values);
        } catch (error) {
            return await this.retryWithReformatPrompt(result, messages, config);
        }
    }

    private async retryWithReformatPrompt(result: string, messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<ICoreValue[], Error>> {
        const reformatPrompt = retryCoreValuesPrompt();
        const reformatResult = await this.llmProvider.chat([
            ...messages,
            { role: 'assistant', content: result },
            reformatPrompt
        ], config);

        if (reformatResult.isErr()) {
            return err(reformatResult.error);
        }

        try {
            const parsed = JSON.parse(reformatResult.value);
            const parsedValues = CoreValueSchema.safeParse(parsed);
            
            if(!parsedValues.success) {
                return err(new Error('Failed to get properly formatted core values after retry'));
            }
            
            return ok(parsedValues.data.core_values);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to parse core values response'));
        }
    }
} 


