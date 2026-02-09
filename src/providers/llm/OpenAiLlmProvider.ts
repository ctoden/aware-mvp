import { DependencyService } from "@src/core/injection/DependencyService";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Nilable } from "@src/core/types/Nullable";
import { BaseLlmProvider } from "@src/providers/llm/BaseLlmProvider";
import { AsyncActionQueue } from "@src/utils/AsyncActionQueue";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { err, ok, Result } from "neverthrow";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { singleton } from "tsyringe";
import { z } from "zod";
import { ILlmProvider, LlmMessage, LlmModelConfig } from "./LlmProvider";
import { getFromEnv } from "@src/utils/EnvUtils";

type OpenAiRole = "user" | "assistant" | "system";
type OpenAiContent = string | Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: {
        url: string;
    };
}>;

type OpenAiMessage = {
    role: OpenAiRole;
    content: OpenAiContent;
};

function mapToOpenAiMessage(message: LlmMessage): any {
    if (typeof message.content === 'string') {
        return {
            role: message.role as OpenAiRole,
            content: message.content
        };
    }

    return {
        role: message.role as OpenAiRole,
        content: message.content.map(content => ({
            type: content.type,
            text: content.text,
            image_url: content.imageUrl
        }))
    };
}

@singleton()
export class OpenAiLlmProvider extends BaseLlmProvider implements ILlmProvider {
    private static _instance: OpenAiLlmProvider;
    private _openAiClient: Nilable<OpenAI>;
    name = 'OpenAiLlmProvider';
    readonly supportsStructuredOutputs = true;
    readonly supportsJsonResultOutput = true;

    private readonly _modelNames: string[] = [
        'gpt-4o',
        'gpt-4o-mini',
        'o1',
        'o1-mini',
        'gpt-4o-realtime-preview',
        'gpt-4o-mini-realtime-preview',
        'gpt-4o-audio-preview',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'dall-e-3',
        'tts-1',
        'tts-1-hd',
        'whisper-1',
        'text-embedding-3-large',
        'text-embedding-3-small',
        'text-embedding-ada-002',
        'omni-moderation-latest',
        'text-moderation-latest',
        'text-moderation-stable'
    ];

    private readonly _defaultModel: LlmModelConfig = {
        modelName: DependencyService.resolveSafe<string>('OPENAI_DEFAULT_MODEL') ?? 'gpt-4o',
        temperature: 0.7,
        maxTokens: 2048
    };

    constructor() {
        super();
        if (OpenAiLlmProvider._instance) {
            return OpenAiLlmProvider._instance;
        }
        OpenAiLlmProvider._instance = this;
    }

    static getInstance(): OpenAiLlmProvider {
        if (!OpenAiLlmProvider._instance) {
            OpenAiLlmProvider._instance = new OpenAiLlmProvider();
        }
        return OpenAiLlmProvider._instance;
    }

    getDefaultModel(): LlmModelConfig {
        return this._defaultModel;
    }

    getAvailableModels(): string[] {
        return this._modelNames;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        const dependencyApiKey = DependencyService.resolveSafe<string>('OPENAI_API_KEY');
        const apiKey = getFromEnv('EXPO_PUBLIC_OPENAI_API_KEY', dependencyApiKey ?? undefined);
        if (!apiKey) {
            return err(new Error('OPENAI_API_KEY is not defined in the environment variables.'));
        }
        this._openAiClient = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this._openAiClient = null;
        return BR_TRUE;
    }

    public updateDefaultModel(model?: LlmModelConfig): void {
        if (!model) {
            model = this._defaultModel;
            model.modelName = DependencyService.resolveSafe<string>('OPENAI_DEFAULT_MODEL') ?? model.modelName;
        }
        this._defaultModel.modelName = model.modelName;
        this._defaultModel.temperature = model.temperature;
        this._defaultModel.maxTokens = model.maxTokens;
    }

    private ensureClient(): Result<OpenAI, Error> {
        if (!this._openAiClient) {
            return err(new Error('OpenAI client is not initialized'));
        }
        return ok(this._openAiClient);
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
    
                        const response = await clientResult.value.chat.completions.create({
                            model: modelName,
                            messages: processedMessages.map(mapToOpenAiMessage) as any,
                            temperature: config?.temperature ?? this._defaultModel.temperature,
                            max_tokens: config?.maxTokens ?? this._defaultModel.maxTokens
                        });
    
                        if (!response || !response.choices) {
                            return err(new Error("Response not found"));
                        }
    
                        const result = response.choices[0].message.content?.toString() ?? "";
    
                        return ok(result);
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

                        const stream = await clientResult.value.chat.completions.create({
                            model: modelName,
                            messages: processedMessages.map(mapToOpenAiMessage) as any,
                            temperature: config?.temperature ?? this._defaultModel.temperature,
                            max_tokens: config?.maxTokens ?? this._defaultModel.maxTokens,
                            stream: true
                        });

                        let responseChunks: string[] = [];
                        for await (const chunk of stream) {
                            if (chunk.choices[0]?.delta?.content) {
                                responseChunks.push(chunk.choices[0].delta.content.toString());
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
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`,
                            },
                        },
                    ],
                } as any;

                const response = await clientResult.value.chat.completions.create({
                    model: "gpt-4o", // Using GPT-4 Vision for image processing
                    messages: [message],
                    max_tokens: 4096
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
        const clientResult = this.ensureClient();
        if (clientResult.isErr()) {
            return err(clientResult.error);
        }

        return this.executeQueuedAction(async () => {
            return this.processLlmOperation(messages, async (processedMessages) => {
                const modelName = config?.modelName && this._modelNames.includes(config.modelName) 
                    ? config.modelName 
                    : this._defaultModel.modelName;

                const response = await clientResult.value.beta.chat.completions.parse({
                    model: modelName,
                    messages: processedMessages.map(mapToOpenAiMessage) as any,
                    temperature: config?.temperature ?? this._defaultModel.temperature,
                    max_tokens: config?.maxTokens ?? this._defaultModel.maxTokens,
                    response_format: zodResponseFormat(schema, "response")
                });

                if (!response || !response.choices || !response.choices[0].message.parsed) {
                    return err(new Error("Response not found"));
                }

                try {
                    const rawResponse = response.choices[0].message.parsed;
                    const parseResult = schema.safeParse(rawResponse);
                    
                    if (!parseResult.success) {
                        return err(new Error(`Invalid response format: ${parseResult.error.message}`));
                    }

                    return ok(parseResult.data);
                } catch (parseError) {
                    return err(new Error('Failed to parse structured output as JSON'));
                }
            });
        });
    }
    
    async generateJsonSchemaOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>> {
        return this.generateStructuredOutput(messages, schema, config);
    }
} 