import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_ERR, BR_TRUE } from "@src/utils/NeverThrowUtils";
import { ILlmProvider, LlmMessage, LlmModelConfig, LlmMessageProcessor } from "../LlmProvider";
import { z } from "zod";

type MockResponse = {
    prompt: string;
    response: string;
};

@singleton()
export class TestLlmProvider extends ObservableLifecycleManager implements ILlmProvider {
    private static _instance: TestLlmProvider;
    private mockResponses: MockResponse[] = [];
    private defaultDelayMs = 100;
    private shouldFailInit = false;
    private nextResponses: string[] = [];
    name = 'TestLlmProvider';
    protected _supportsStructuredOutputs = true;
    protected _supportsJsonResultOutput = true;
    private preProcessors: LlmMessageProcessor[] = [];
    private postProcessors: LlmMessageProcessor[] = [];

    private readonly _modelNames: string[] = [
        'test-small',
        'test-medium',
        'test-large'
    ];

    private readonly _defaultModel: LlmModelConfig = {
        modelName: 'test-small',
        temperature: 0.7,
        maxTokens: 1024
    };

    constructor(structuredOutput: boolean = true, jsonResultOutput: boolean = true) {
        super();
        this._supportsStructuredOutputs = structuredOutput;
        this._supportsJsonResultOutput = jsonResultOutput;
        if (TestLlmProvider._instance) {
            return TestLlmProvider._instance;
        }
        TestLlmProvider._instance = this;
    }

    static getInstance(): TestLlmProvider {
        if (!TestLlmProvider._instance) {
            TestLlmProvider._instance = new TestLlmProvider();
        }
        return TestLlmProvider._instance;
    }

    get supportsStructuredOutputs(): boolean {
        return this._supportsStructuredOutputs;
    }

    get supportsJsonResultOutput(): boolean {
        return this._supportsJsonResultOutput;
    }

    getDefaultModel(): LlmModelConfig {
        return this._defaultModel;
    }

    getAvailableModels(): string[] {
        return [...this._modelNames];
    }

    // Test helper methods
    setShouldFailInit(shouldFail: boolean): void {
        this.shouldFailInit = shouldFail;
    }

    setMockResponse(prompt: string, response: string): void {
        this.mockResponses = this.mockResponses.filter(r => r.prompt !== prompt);
        this.mockResponses.push({ prompt, response });
    }

    setDefaultDelay(delayMs: number): void {
        this.defaultDelayMs = delayMs;
    }

    clearMockResponses(): void {
        this.mockResponses = [];
        this.nextResponses = [];
    }

    setSupportsStructuredOutputs(supportsStructuredOutputs: boolean): void {
        this._supportsStructuredOutputs = supportsStructuredOutputs;
    }

    setSupportsJsonResultOutput(supportsJsonResultOutput: boolean): void {
        this._supportsJsonResultOutput = supportsJsonResultOutput;
    }

    setNthResponse(index: number, response: string): void {
        // Ensure array is large enough
        while (this.nextResponses.length <= index) {
            this.nextResponses.push('');
        }
        this.nextResponses[index] = response;
    }

    setNextResponse(response: string): void {
        this.setNthResponse(0, response);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if (this.shouldFailInit) {
            return BR_ERR('Test provider initialization failed');
        }
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.mockResponses = [];
        return BR_TRUE;
    }

    private getRandomDelay(): number {
        return this.defaultDelayMs * (0.5 + Math.random());
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private generateRandomResponse(prompt: string): string {
        const responses = [
            `Here's a response to: ${prompt}`,
            `I understand you're asking about: ${prompt}`,
            `Let me help you with: ${prompt}`,
            `Regarding your question about: ${prompt}`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
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

    async chat(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>> {
        try {
            await this.delay(this.getRandomDelay());

            // Pre-process messages
            const preProcessResult = await this.preProcess(messages);
            if (preProcessResult.isErr()) {
                return err(preProcessResult.error);
            }
            const processedMessages = preProcessResult.value;

            // Check for nextResponses first
            if (this.nextResponses.length > 0) {
                const response = this.nextResponses.shift()!;
                if (response.toLowerCase() === 'error') {
                    return err(new Error('Mock error response'));
                }

                // Post-process the response
                const postProcessResult = await this.postProcess([{ role: 'assistant', content: response }]);
                if (postProcessResult.isErr()) {
                    return err(postProcessResult.error);
                }
                return ok(postProcessResult.value[0].content.toString());
            }

            const lastMessage = processedMessages[processedMessages.length - 1];
            const prompt = typeof lastMessage.content === 'string' 
                ? lastMessage.content 
                : lastMessage.content.map(c => c.text).join(' ');

            const mockResponse = this.mockResponses.find(r => r.prompt === prompt);
            if (mockResponse) {
                if(mockResponse.response.toLowerCase() === 'error') {
                    return err(new Error('Mock error response'));
                }

                // Post-process the response
                const postProcessResult = await this.postProcess([{ role: 'assistant', content: mockResponse.response }]);
                if (postProcessResult.isErr()) {
                    return err(postProcessResult.error);
                }
                return ok(postProcessResult.value[0].content.toString());
            }

            const generatedResponse = this.generateRandomResponse(prompt);
            // Post-process the response
            const postProcessResult = await this.postProcess([{ role: 'assistant', content: generatedResponse }]);
            if (postProcessResult.isErr()) {
                return err(postProcessResult.error);
            }
            return ok(postProcessResult.value[0].content.toString());
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate chat response'));
        }
    }

    async chatStream(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>> {
        return this.chat(messages, config);
    }

    async generateImageSummary(base64Image: string, mimeType: string, config?: LlmModelConfig): Promise<Result<string, Error>> {
        try {
            await this.delay(this.getRandomDelay());

            const mockResponse = this.mockResponses.find(r => r.prompt === 'image_summary');
            if (mockResponse) {
                // Post-process the response
                const postProcessResult = await this.postProcess([{ role: 'assistant', content: mockResponse.response }]);
                if (postProcessResult.isErr()) {
                    return err(postProcessResult.error);
                }
                return ok(postProcessResult.value[0].content.toString());
            }

            const response = 'This is a test OCR response from an image. The image appears to contain some text.';
            // Post-process the response
            const postProcessResult = await this.postProcess([{ role: 'assistant', content: response }]);
            if (postProcessResult.isErr()) {
                return err(postProcessResult.error);
            }
            return ok(postProcessResult.value[0].content.toString());
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate image summary'));
        }
    }

    async generateStructuredOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>> {
        try {
            const chatResult = await this.chat(messages, config);
            if (chatResult.isErr()) {
                return err(chatResult.error);
            }

            const parsed = JSON.parse(chatResult.value);
            const result = schema.safeParse(parsed);
            if (!result.success) {
                return err(new Error(`Invalid response format: ${result.error.message}`));
            }
            return ok(result.data);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to generate structured output'));
        }
    }

    async generateJsonSchemaOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>> {
        return this.generateStructuredOutput(messages, schema, config);
    }

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
}

