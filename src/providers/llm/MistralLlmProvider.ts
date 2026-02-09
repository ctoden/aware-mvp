import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { Mistral } from "@mistralai/mistralai";
import { DependencyService } from "@src/core/injection/DependencyService";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { ILlmProvider, LlmMessage, LlmModelConfig } from "./LlmProvider";
import { Nilable } from "@src/core/types/Nullable";
import { z } from "zod";
import { BaseLlmProvider } from "./BaseLlmProvider";
import { getFromEnv } from "@src/utils/EnvUtils";

type MistralRole = "user" | "assistant" | "system";
type MistralContent = string | Array<{
    type: "text" | "image_url";
    text?: string;
    imageUrl?: {
        url: string;
    };
}>;

type MistralMessage = {
    role: MistralRole;
    content: MistralContent;
};

function mapToMistralMessage(message: LlmMessage): any {
    if (typeof message.content === 'string') {
        return {
            role: message.role as MistralRole,
            content: message.content
        };
    }

    return {
        role: message.role as MistralRole,
        content: message.content.map(content => ({
            type: content.type,
            text: content.text,
            imageUrl: content.imageUrl
        }))
    };
}

@singleton()
export class MistralLlmProvider extends BaseLlmProvider implements ILlmProvider {
    private static _instance: MistralLlmProvider;
    private _mistralClient: Nilable<Mistral>;
    name = 'MistralLlmProvider';
    readonly supportsStructuredOutputs = false;
    readonly supportsJsonResultOutput = true;

    private readonly _modelNames: string[] = [
        'mistral-large-latest',
        'ministral-3b-latest',
        'ministral-8b-latest',
        'mistral-small-latest',
        'open-mistral-nemo',
        'pixtral-large-latest',
    ];

    private readonly _defaultModel: LlmModelConfig = {
        modelName: DependencyService.resolveSafe<string>('MISTRAL_DEFAULT_MODEL') ?? 'ministral-8b-latest',
        temperature: 0.7,
        maxTokens: 2048
    };

    constructor() {
        super();
        if (MistralLlmProvider._instance) {
            return MistralLlmProvider._instance;
        }
        MistralLlmProvider._instance = this;
    }

    static getInstance(): MistralLlmProvider {
        if (!MistralLlmProvider._instance) {
            MistralLlmProvider._instance = new MistralLlmProvider();
        }
        return MistralLlmProvider._instance;
    }

    getDefaultModel(): LlmModelConfig {
        return this._defaultModel;
    }

    getAvailableModels(): string[] {
        return [...this._modelNames];
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        const dependencyApiKey = DependencyService.resolveSafe<string>('MISTRAL_API_KEY');
        const apiKey = getFromEnv('EXPO_PUBLIC_MISTRAL_API_KEY', dependencyApiKey ?? undefined);
        if (!apiKey) {
            return err(new Error('MISTRAL_API_KEY is not defined in the environment variables.'));
        }
        this._mistralClient = new Mistral({ apiKey });
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this._mistralClient = null;
        return BR_TRUE;
    }

    public updateDefaultModel(model?: LlmModelConfig): void {
        if (!model) {
            model = this._defaultModel;
            model.modelName = DependencyService.resolveSafe<string>('MISTRAL_DEFAULT_MODEL') ?? model.modelName;
        }
        this._defaultModel.modelName = model.modelName;
        this._defaultModel.temperature = model.temperature;
        this._defaultModel.maxTokens = model.maxTokens;
    }

    private ensureClient(): Result<Mistral, Error> {
        if (!this._mistralClient) {
            return err(new Error('Mistral client is not initialized'));
        }
        return ok(this._mistralClient);
    }

    async chat(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>> {
        const clientResult = this.ensureClient();
        if (clientResult.isErr()) {
            return err(clientResult.error);
        }

        return this.executeQueuedAction(async () => {
            return this.processLlmOperation(
                messages,
                async (processedMessages) => {
                    try {
                        const modelName = config?.modelName && this._modelNames.includes(config.modelName) 
                            ? config.modelName 
                            : this._defaultModel.modelName;
        
                        const response = await clientResult.value.chat.complete({
                            model: modelName,
                            messages: processedMessages.map(mapToMistralMessage) as any,
                            temperature: config?.temperature ?? this._defaultModel.temperature,
                            maxTokens: config?.maxTokens ?? this._defaultModel.maxTokens
                        });
        
                        if (!response || !response.choices) {
                            return err(new Error("Response not found"));
                        }
        
                        return ok(response.choices[0].message.content?.toString() ?? "");
                    } catch (error) {
                        return err(error instanceof Error ? error : new Error('Failed to generate chat response'));
                    }
                },
                true // shouldPostProcess
            );
        });
    }

    async chatStream(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>> {
        const clientResult = this.ensureClient();
        if (clientResult.isErr()) {
            return err(clientResult.error);
        }

        return this.executeQueuedAction(async () => {
            return this.processLlmOperation(
                messages,
                async (processedMessages) => {
                    try {
                        const modelName = config?.modelName && this._modelNames.includes(config.modelName) 
                            ? config.modelName 
                            : this._defaultModel.modelName;

                        const stream = await clientResult.value.chat.stream({
                            model: modelName,
                            messages: processedMessages.map(mapToMistralMessage) as any,
                            temperature: config?.temperature ?? this._defaultModel.temperature,
                            maxTokens: config?.maxTokens ?? this._defaultModel.maxTokens
                        });

                        let responseChunks: string[] = [];
                        for await (const chunk of stream) {
                            if (chunk.data.choices[0]?.delta?.content) {
                                responseChunks.push(chunk.data.choices[0].delta.content.toString());
                            }
                        }

                        return ok(responseChunks.join(''));
                    } catch (error) {
                        return err(error instanceof Error ? error : new Error('Failed to generate streaming chat response'));
                    }
                },
                true // shouldPostProcess
            );
        });
    }

    async generateImageSummary(base64Image: string, mimeType: string, config?: LlmModelConfig): Promise<Result<string, Error>> {
        const clientResult = this.ensureClient();
        if (clientResult.isErr()) {
            return err(clientResult.error);
        }

        // Verify base64 image data
        const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
        if (!base64Regex.test(base64Image) || base64Image === "invalid-base64-data") {
            return err(new Error("Invalid base64 image data"));
        }

        return this.executeQueuedAction(async () => {
            try {
                const message = {
                    role: "user",
                    content: [
                        { type: "text", text: "Act as an OCR and extract the text from the image." },
                        {
                            type: "image_url",
                            imageUrl: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        },
                    ],
                } as any;

                const response = await clientResult.value.chat.complete({
                    model: "pixtral-large-latest", // This model is required for image processing
                    messages: [message],
                });

                if (!response || !response.choices) {
                    return err(new Error("Response not found"));
                }

                return ok(response.choices[0].message.content?.toString() ?? "");
            } catch (error) {
                return err(error instanceof Error ? error : new Error('Failed to generate image summary'));
            }
        });
    }

    async generateStructuredOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>> {
        return this.generateJsonSchemaOutput(messages, schema, config);
    }

    async generateJsonSchemaOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>> {
        const clientResult = this.ensureClient();
        if (clientResult.isErr()) {
            return err(clientResult.error);
        }

        return this.executeQueuedAction(async () => {
            return this.processLlmOperation(
                messages,
                async (processedMessages) => {
                    try {
                        const modelName = config?.modelName && this._modelNames.includes(config.modelName) 
                            ? config.modelName 
                            : this._defaultModel.modelName;
        
                        const response = await clientResult.value.chat.complete({
                            model: modelName,
                            messages: processedMessages.map(mapToMistralMessage) as any,
                            temperature: config?.temperature ?? this._defaultModel.temperature,
                            maxTokens: config?.maxTokens ?? this._defaultModel.maxTokens,
                            responseFormat: { type: "json_object" }
                        });
        
                        if (!response || !response.choices) {
                            return err(new Error("Response not found"));
                        }
        
                        const content = response.choices[0].message.content?.toString() ?? "";
                        try {
                            const parsed = JSON.parse(content);
                            const result = schema.safeParse(parsed);
                            if (!result.success) {
                                return err(new Error(`Invalid response format: ${result.error.message}`));
                            }
                            return ok(result.data);
                        } catch (error) {
                            return err(new Error('Failed to parse JSON response'));
                        }
                    } catch (error) {
                        return err(error instanceof Error ? error : new Error('Failed to generate JSON schema output'));
                    }
                },
                true // shouldPostProcess
            );
        });
    }
} 
