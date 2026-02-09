import { Result, err, ok } from "neverthrow";
import { z } from "zod";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { ILlmProvider, LlmMessage, LlmModelConfig, LlmMessageProcessor } from "./LlmProvider";
import { AsyncActionQueue } from "@src/utils/AsyncActionQueue";
import { wait } from "@src/utils/PromiseUtils";
import { getFromEnv } from "@src/utils/EnvUtils";
import { nanoid } from "nanoid";

export abstract class BaseLlmProvider extends ObservableLifecycleManager implements ILlmProvider {
    abstract readonly supportsStructuredOutputs: boolean;
    abstract readonly supportsJsonResultOutput: boolean;
    abstract name: string;

    protected asyncActionQueue = new AsyncActionQueue(
        parseInt(getFromEnv('LLM_MAX_CONCURRENT_ACTIONS', '2') || '2'),
        `BaseLlmProvider`
    );
    protected preProcessors: LlmMessageProcessor[] = [];
    protected postProcessors: LlmMessageProcessor[] = [];

    registerPreProcessor(processor: LlmMessageProcessor): void {
        this.preProcessors.push(processor);
    }

    removePreProcessor(processor: LlmMessageProcessor): boolean {
        const index = this.preProcessors.indexOf(processor);
        if (index !== -1) {
            this.preProcessors.splice(index, 1);
            return true;
        }
        return false;
    }

    removeAllPreProcessors(): void {
        this.preProcessors = [];
    }

    registerPostProcessor(processor: LlmMessageProcessor): void {
        this.postProcessors.push(processor);
    }

    removePostProcessor(processor: LlmMessageProcessor): boolean {
        const index = this.postProcessors.indexOf(processor);
        if (index !== -1) {
            this.postProcessors.splice(index, 1);
            return true;
        }
        return false;
    }

    removeAllPostProcessors(): void {
        this.postProcessors = [];
    }

    protected async processMessages(messages: LlmMessage[], processors: LlmMessageProcessor[]): Promise<Result<LlmMessage[], Error>> {
        let processedMessages = messages;
        
        for (const processor of processors) {
            const result = await processor(processedMessages);
            if (result.isErr()) {
                return err(result.error);
            }
            processedMessages = result.value;
        }
        
        return ok(processedMessages);
    }

    protected async preProcess(messages: LlmMessage[]): Promise<Result<LlmMessage[], Error>> {
        return this.processMessages(messages, this.preProcessors);
    }

    protected async postProcess(messages: LlmMessage[]): Promise<Result<LlmMessage[], Error>> {
        return this.processMessages(messages, this.postProcessors);
    }

    /**
     * Gets the maximum number of concurrent actions allowed by the provider
     * @returns The maximum number of concurrent actions
     */
    getMaxConcurrentActions(): number {
        return this.asyncActionQueue.getMaxConcurrentActions();
    }

    abstract getDefaultModel(): LlmModelConfig;
    abstract getAvailableModels(): string[];
    abstract chat(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>>;
    abstract chatStream(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>>;
    abstract generateImageSummary(base64Image: string, mimeType: string, config?: LlmModelConfig): Promise<Result<string, Error>>;
    abstract generateStructuredOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>>;
    abstract generateJsonSchemaOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>>;

    protected executeQueuedAction<T>(action: () => Promise<Result<T, Error>>): Promise<Result<T, Error>> {
        // Create a promise that will resolve when the queued action completes
        return new Promise<Result<T, Error>>((resolve) => {
            // Queue the actual action
            this.asyncActionQueue.executeAction(async () => {
                try {
                    const result = await action();
                    resolve(result);
                    await wait(50); // Wait after resolving to avoid rate limits
                    return true;
                } catch (error) {
                    resolve(err(error instanceof Error ? error : new Error(String(error))));
                    return false;
                }
            }).catch((queueError) => {
                // Handle queue errors
                resolve(err(queueError instanceof Error ? queueError : new Error(String(queueError))));
            });
        });
    }

    protected async processLlmOperation<T>(
        messages: LlmMessage[],
        operation: (processedMessages: LlmMessage[]) => Promise<Result<T, Error>>,
        shouldPostProcess: boolean = false
    ): Promise<Result<T, Error>> {
        // Pre-process messages
        const preProcessResult = await this.preProcess(messages);
        if (preProcessResult.isErr()) {
            return err(preProcessResult.error);
        }

        // Execute operation with processed messages
        const operationResult = await operation(preProcessResult.value);
        if (operationResult.isErr()) {
            return err(operationResult.error);
        }

        // Post-process if needed (mainly for chat operations that return messages)
        if (shouldPostProcess && Array.isArray(operationResult.value)) {
            const postProcessResult = await this.postProcess(operationResult.value as unknown as LlmMessage[]);
            if (postProcessResult.isErr()) {
                return err(postProcessResult.error);
            }
            return ok(postProcessResult.value as unknown as T);
        }

        return operationResult;
    }
}
