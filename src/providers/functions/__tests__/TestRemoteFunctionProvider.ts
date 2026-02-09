import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { IRemoteFunctionProvider } from "../RemoteFunctionProvider";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_ERR, BR_TRUE } from "@src/utils/NeverThrowUtils";

type MockResponse = {
    functionName: string;
    response: any;
};

type MockPdfData = {
    text: string;
    metadata?: any;
    pages?: number;
};

@singleton()
export class TestRemoteFunctionProvider extends ObservableLifecycleManager implements IRemoteFunctionProvider {
    private static _instance: TestRemoteFunctionProvider;
    private mockResponses: MockResponse[] = [];
    private defaultDelayMs = 100;
    private shouldFailInit = false;
    private mockPdfData: MockPdfData | null = null;
    name = 'TestRemoteFunctionProvider';

    constructor() {
        super();
        if (TestRemoteFunctionProvider._instance) {
            return TestRemoteFunctionProvider._instance;
        }
        TestRemoteFunctionProvider._instance = this;
    }

    static getInstance(): TestRemoteFunctionProvider {
        if (!TestRemoteFunctionProvider._instance) {
            TestRemoteFunctionProvider._instance = new TestRemoteFunctionProvider();
        }
        return TestRemoteFunctionProvider._instance;
    }

    // Test helper methods
    setShouldFailInit(shouldFail: boolean): void {
        this.shouldFailInit = shouldFail;
    }

    setMockPdfData(data: MockPdfData): void {
        this.mockPdfData = data;
    }

    clearMockPdfData(): void {
        this.mockPdfData = null;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if (this.shouldFailInit) {
            return BR_ERR('Test provider initialization failed');
        }
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.mockResponses = [];
        this.mockPdfData = null;
        return BR_TRUE;
    }

    // Test helper methods
    setMockResponse(functionName: string, response: any): void {
        this.mockResponses = this.mockResponses.filter(r => r.functionName !== functionName);
        this.mockResponses.push({ functionName, response });
    }

    setDefaultDelay(delayMs: number): void {
        this.defaultDelayMs = delayMs;
    }

    clearMockResponses(): void {
        this.mockResponses = [];
    }

    private getRandomDelay(): number {
        // Random delay between 50% and 150% of default delay
        return this.defaultDelayMs * (0.5 + Math.random());
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private generateRandomResponse<T>(): T {
        // Generate a simple random response if no mock is provided
        const types = ['string', 'number', 'boolean', 'object'];
        const type = types[Math.floor(Math.random() * types.length)];

        switch (type) {
            case 'string':
                return `random_${Math.random().toString(36).substring(7)}` as unknown as T;
            case 'number':
                return Math.floor(Math.random() * 1000) as unknown as T;
            case 'boolean':
                return (Math.random() > 0.5) as unknown as T;
            case 'object':
                return {
                    id: Math.floor(Math.random() * 1000),
                    value: Math.random().toString(36).substring(7)
                } as unknown as T;
            default:
                return null as unknown as T;
        }
    }

    async invoke<T = any>(functionName: string, args?: Record<string, any>): Promise<Result<T, Error>> {
        try {
            // Simulate network delay
            await this.delay(this.getRandomDelay());

            // Special handling for PDF extraction
            if (functionName === 'pdf-extract') {
                if (!this.mockPdfData) {
                    return err(new Error('No mock PDF data provided'));
                }

                const response = {
                    textBase64: btoa(this.mockPdfData.text),
                    metadata: this.mockPdfData.metadata ?? {},
                    pages: this.mockPdfData.pages ?? 1
                };

                return ok(response as unknown as T);
            }

            // Find mock response for other functions
            const mockResponse = this.mockResponses.find(r => r.functionName === functionName);

            if (mockResponse) {
                return ok(mockResponse.response as T);
            }

            // Generate random response if no mock is provided
            return ok(this.generateRandomResponse<T>());
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to invoke remote function'));
        }
    }
} 