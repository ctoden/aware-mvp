import { DependencyService } from "@src/core/injection/DependencyService";
import { TestLlmProvider } from "@src/providers/llm/__tests__/TestLlmProvider";
import { TestRemoteFunctionProvider } from "@src/providers/functions/__tests__/TestRemoteFunctionProvider";
import { LlmService } from "@src/services/LlmService";
import { RemoteFunctionService } from "@src/services/RemoteFunctionService";
import { getTextFromAssessmentFile, FileUploadProgressInfo } from "../AssessmentResultsFileUploadUtils";
import { isAuthenticated$ } from "@src/models/SessionModel";
import { DocumentPickerAsset } from "expo-document-picker";
import { LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { REMOTE_FUNCTION_PROVIDER_KEY } from "@src/providers/functions/RemoteFunctionProvider";

describe('AssessmentResultsFileUploadUtils', () => {
    let testLlmProvider: TestLlmProvider;
    let testRemoteFunctionProvider: TestRemoteFunctionProvider;
    let llmService: LlmService;
    let remoteFunctionService: RemoteFunctionService;
    let mockProgressCallback: jest.Mock<void, [FileUploadProgressInfo]>;

    beforeEach(async () => {
        // Reset authentication state
        isAuthenticated$.set(true);

        // Create and initialize test providers
        testLlmProvider = new TestLlmProvider();
        testRemoteFunctionProvider = new TestRemoteFunctionProvider();
        await testLlmProvider.initialize();
        await testRemoteFunctionProvider.initialize();

        // Register providers
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
        DependencyService.registerValue(REMOTE_FUNCTION_PROVIDER_KEY, testRemoteFunctionProvider);

        // Create and initialize services
        llmService = new LlmService();
        remoteFunctionService = new RemoteFunctionService();
        await llmService.initialize();
        await remoteFunctionService.initialize();

        // Mock progress callback
        mockProgressCallback = jest.fn();

        // Reset providers
        testLlmProvider.clearMockResponses();
        testRemoteFunctionProvider.clearMockResponses();
        testRemoteFunctionProvider.clearMockPdfData();
    });

    afterEach(async () => {
        await llmService.end();
        await remoteFunctionService.end();
        await testLlmProvider.end();
        await testRemoteFunctionProvider.end();
        testLlmProvider.setShouldFailInit(false);
        testRemoteFunctionProvider.setShouldFailInit(false);
    });

    const createMockFile = (name: string, content: string): DocumentPickerAsset => ({
        name,
        uri: `data:text/plain;base64,${Buffer.from(content).toString('base64')}`,
        size: content.length,
        mimeType: 'text/plain'
    });

    describe('Text File Processing', () => {
        it('should successfully process a txt file', async () => {
            // Arrange
            const content = 'This is a test content';
            const file = createMockFile('test.txt', content);

            // Act
            const result = await getTextFromAssessmentFile(file);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(content);
            }
        });
    });

    describe('PDF File Processing', () => {
        it('should successfully process a pdf file', async () => {
            // Arrange
            const pdfContent = 'This is PDF content';
            testRemoteFunctionProvider.setMockPdfData({
                text: pdfContent,
                pages: 1
            });
            const file = createMockFile('test.pdf', 'mock pdf content');

            // Act
            const result = await getTextFromAssessmentFile(file, mockProgressCallback);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(pdfContent);
            }
            expect(mockProgressCallback).toHaveBeenCalledWith({
                type: 'info',
                text1: 'Processing PDF File',
                text2: 'Processing PDF files, please wait this can take a while',
            });
        });

        it('should handle pdf processing errors', async () => {
            // Arrange
            testRemoteFunctionProvider.setShouldFailInit(true);
            const file = createMockFile('test.pdf', 'mock pdf content');

            // Act
            const result = await getTextFromAssessmentFile(file);

            // Assert
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Image File Processing', () => {
        const imageTypes = ['jpg', 'jpeg', 'png'];

        imageTypes.forEach(imageType => {
            it(`should successfully process a ${imageType} file`, async () => {
                // Arrange
                const expectedOcrText = 'OCR extracted text';
                testLlmProvider.setMockResponse('image_summary', expectedOcrText);
                const file = createMockFile(`test.${imageType}`, 'mock image content');

                // Act
                const result = await getTextFromAssessmentFile(file, mockProgressCallback);

                // Assert
                expect(result.isOk()).toBe(true);
                if (result.isOk()) {
                    expect(result.value).toBe(expectedOcrText);
                }
                expect(mockProgressCallback).toHaveBeenCalledWith({
                    type: 'info',
                    text1: 'Processing Image (wait)',
                    text2: 'Please wait, this can take a while',
                });
            });
        });

        it('should handle image processing errors', async () => {
            // Arrange
            testLlmProvider.setShouldFailInit(true);
            const file = createMockFile('test.jpg', 'mock image content');

            // Act
            const result = await getTextFromAssessmentFile(file);

            // Assert
            expect(result.isErr()).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle null file input', async () => {
            // Act
            const result = await getTextFromAssessmentFile(null as any);

            // Assert
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No file selected');
            }
        });

        it('should handle files without extension', async () => {
            // Arrange
            const file = createMockFile('test', 'content');

            // Act
            const result = await getTextFromAssessmentFile(file);

            // Assert
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('File has no extension, unknown file type');
            }
        });

        it('should handle unsupported file types', async () => {
            // Arrange
            const file = createMockFile('test.xyz', 'content');

            // Act
            const result = await getTextFromAssessmentFile(file);

            // Assert
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Unsupported File Type');
            }
        });

        it('should handle unauthenticated users', async () => {
            // Arrange
            isAuthenticated$.set(false);
            const file = createMockFile('test.txt', 'content');

            // Act
            const result = await getTextFromAssessmentFile(file);

            // Assert
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('User is not authenticated');
            }
        });
    });
}); 