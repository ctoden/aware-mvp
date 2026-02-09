import { Result } from "neverthrow";
import { LifeCycleManager } from "@src/core/lifecycle/LifeCycleManager";
import { z } from "zod";
import Mustache from "mustache";

export const LLM_PROVIDER_KEY = "LLM_PROVIDER_KEY";

export type LlmMessage = {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
        type: 'text' | 'image_url';
        text?: string;
        imageUrl?: {
            url: string;
        };
    }>;
};

export type LlmModelConfig = {
    modelName: string;
    maxTokens?: number;
    temperature?: number;
};

export type LlmMessageProcessor = (messages: LlmMessage[]) => Promise<Result<LlmMessage[], Error>>;

export interface ILlmProvider extends LifeCycleManager {
    /**
     * Whether this provider supports structured outputs
     */
    readonly supportsStructuredOutputs: boolean;
    readonly supportsJsonResultOutput: boolean;
    
    /**
     * Register a pre-process handler for LLM messages
     * @param processor Function that processes messages before sending to LLM
     */
    registerPreProcessor(processor: LlmMessageProcessor): void;

    /**
     * Remove a pre-process handler from LLM messages
     * @param processor Function to remove from pre-processors
     * @returns true if processor was found and removed, false otherwise
     */
    removePreProcessor(processor: LlmMessageProcessor): boolean;

    /**
     * Remove all pre-process handlers
     */
    removeAllPreProcessors(): void;

    /**
     * Register a post-process handler for LLM messages
     * @param processor Function that processes messages after receiving from LLM
     */
    registerPostProcessor(processor: LlmMessageProcessor): void;

    /**
     * Remove a post-process handler from LLM messages
     * @param processor Function to remove from post-processors
     * @returns true if processor was found and removed, false otherwise
     */
    removePostProcessor(processor: LlmMessageProcessor): boolean;

    /**
     * Remove all post-process handlers
     */
    removeAllPostProcessors(): void;

    /**
     * Get the default model configuration for this provider
     */
    getDefaultModel(): LlmModelConfig;

    /**
     * Get a list of available models for this provider
     */
    getAvailableModels(): string[];

    /**
     * Generate a response from the LLM
     * @param messages The conversation history
     * @param config Optional model configuration
     */
    chat(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>>;

    /**
     * Generate a streaming response from the LLM
     * @param messages The conversation history
     * @param config Optional model configuration
     */
    chatStream(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>>;

    /**
     * Generate a summary of an image
     * @param base64Image The image content as base64
     * @param mimeType The image MIME type
     * @param config Optional model configuration
     */
    generateImageSummary(base64Image: string, mimeType: string, config?: LlmModelConfig): Promise<Result<string, Error>>;

    /**
     * Generate a structured output from the LLM using a Zod schema
     * @param messages The conversation history
     * @param schema The Zod schema for the expected output
     * @param config Optional model configuration
     * @throws Error if structured outputs are not supported
     */
    generateStructuredOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>>;

    /**
     * Generates output from the LLM using 'json_object' response format, which is not as strict as Structured Outputs
     * @param messages The conversation history
     * @param schema The JSON schema for the expected output
     * @param config Optional model configuration
     * @throws Error if structured outputs are not supported
     */
    generateJsonSchemaOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>>;
} 
