import { RemoteFunctionService } from '../RemoteFunctionService';
import { TestRemoteFunctionProvider } from '@src/providers/functions/__tests__/TestRemoteFunctionProvider';
import { DependencyService } from "@src/core/injection/DependencyService";
import { REMOTE_FUNCTION_PROVIDER_KEY } from '@src/providers/functions/RemoteFunctionProvider';

describe('RemoteFunctionService', () => {
    let functionService: RemoteFunctionService;
    let testFunctionProvider: TestRemoteFunctionProvider;

    beforeEach(async () => {
        // Create and initialize the test provider
        testFunctionProvider = new TestRemoteFunctionProvider();
        await testFunctionProvider.initialize();
        
        // Register the provider
        DependencyService.registerValue(REMOTE_FUNCTION_PROVIDER_KEY, testFunctionProvider);
        
        // Create and initialize the function service
        functionService = new RemoteFunctionService();
        await functionService.initialize();
    });

    afterEach(async () => {
        await functionService.end();
        await testFunctionProvider.end();
        testFunctionProvider.setShouldFailInit(false);
        testFunctionProvider.clearMockPdfData();
    });

    describe('PDF Parsing', () => {
        it('should parse PDF content successfully', async () => {
            const mockPdfData = {
                text: 'Sample PDF content',
                metadata: { author: 'Test Author' },
                pages: 2
            };
            testFunctionProvider.setMockPdfData(mockPdfData);

            const result = await functionService.parsePdf('dummy-base64-content');
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.text).toBe(mockPdfData.text);
                expect(result.value.metadata).toEqual(mockPdfData.metadata);
                expect(result.value.pages).toBe(mockPdfData.pages);
            }
        });

        it('should handle missing mock PDF data', async () => {
            testFunctionProvider.clearMockPdfData();
            const result = await functionService.parsePdf('dummy-base64-content');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No mock PDF data provided');
            }
        });

        it('should error when no pdf content is provided', async () => {
            const result = await functionService.parsePdf('');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No mock PDF data provided');
            }
        })
    });

    it('should invoke a function with mock response', async () => {
        const mockResponse = { data: 'test response' };
        testFunctionProvider.setMockResponse('testFunction', mockResponse);

        const result = await functionService.invoke<typeof mockResponse>('testFunction');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual(mockResponse);
        }
    });

    it('should invoke a function with arguments', async () => {
        const args = { param1: 'value1', param2: 'value2' };
        const mockResponse = { received: args };
        testFunctionProvider.setMockResponse('testFunction', mockResponse);

        const result = await functionService.invoke<typeof mockResponse>('testFunction', args);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual(mockResponse);
        }
    });

    it('should handle function invocation without mock response', async () => {
        testFunctionProvider.clearMockResponses();
        const result = await functionService.invoke('testFunction');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBeDefined();
        }
    });

    it.skip('should handle initialization failure', async () => {
        DependencyService.container().reset();
        // Create a new provider instance that will fail initialization
        const failingProvider = new TestRemoteFunctionProvider();
        failingProvider.setShouldFailInit(true);
        
        // Register the failing provider
        DependencyService.registerValue(REMOTE_FUNCTION_PROVIDER_KEY, failingProvider);
        
        // Create a new service instance
        const newService = new RemoteFunctionService();
        const initResult = await newService.initialize();
        
        expect(initResult.isErr()).toBe(true);
        if (initResult.isErr()) {
            expect(initResult.error.message).toBe('Test provider initialization failed');
        }
    });

    it('should handle custom delay in test provider', async () => {
        const customDelay = 50;
        testFunctionProvider.setDefaultDelay(customDelay);
        
        const startTime = Date.now();
        await functionService.invoke('testFunction');
        const endTime = Date.now();
        
        // The actual delay should be between 50% and 150% of the custom delay
        const actualDelay = endTime - startTime;
        expect(actualDelay).toBeGreaterThanOrEqual(customDelay * 0.5);
        expect(actualDelay).toBeLessThanOrEqual(customDelay * 1.5);
    });
}); 