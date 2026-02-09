import { DiscViewModel } from '../DiscViewModel';
import { DependencyService } from '@src/core/injection/DependencyService';
import { UserAssessmentService } from '@src/services/UserAssessmentService';
import { TestAuthProvider } from '@src/providers/auth/__tests__/TestAuthProvider';
import { AUTH_PROVIDER_KEY } from '@src/providers/auth/AuthProvider';
import { TestDataProvider } from '@src/providers/data/__tests__/TestDataProvider';
import { DATA_PROVIDER_KEY } from '@src/providers/data/DataProvider';
import { TestLlmProvider } from '@src/providers/llm/__tests__/TestLlmProvider';
import { LLM_PROVIDER_KEY } from '@src/providers/llm/LlmProvider';
import { TestStorageProvider } from '@src/providers/storage/__tests__/TestStorageProvider';
import { STORAGE_PROVIDER_KEY } from '@src/providers/storage/StorageProvider';
import { TestRemoteFunctionProvider } from '@src/providers/functions/__tests__/TestRemoteFunctionProvider';
import { REMOTE_FUNCTION_PROVIDER_KEY } from '@src/providers/functions/RemoteFunctionProvider';
import { AuthService } from '@src/services/AuthService';
import { DataService } from '@src/services/DataService';
import { LlmService } from '@src/services/LlmService';
import { LocalStorageService } from '@src/services/LocalStorageService';
import { RemoteFunctionService } from '@src/services/RemoteFunctionService';
import { user$, session$, isAuthenticated$ } from '@src/models/SessionModel';
import { AssessmentHandlerRegistry } from '@src/providers/assessment/AssessmentHandlerRegistry';
import { DiscAssessmentHandler } from '@src/providers/assessment/handlers/DiscAssessmentHandler';
import { userAssessments$ } from "@src/models/UserAssessment";
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import * as DocumentPicker from 'expo-document-picker';
import { ok } from 'neverthrow';

// Mock DocumentPicker
jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn()
}));

// Mock AssessmentResultsFileUploadUtils
jest.mock('@src/utils/AssessmentResultsFileUploadUtils', () => ({
    getTextFromAssessmentFile: jest.fn()
}));

// Import after mock to get the mocked version
import { getTextFromAssessmentFile } from '@src/utils/AssessmentResultsFileUploadUtils';

describe('DiscViewModel', () => {
    let discViewModel: DiscViewModel;
    let userAssessmentService: UserAssessmentService;
    let navigationViewModel: NavigationViewModel;
    let testAuthProvider: TestAuthProvider;
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;
    let testStorageProvider: TestStorageProvider;
    let testRemoteFunctionProvider: TestRemoteFunctionProvider;
    let authService: AuthService;
    let dataService: DataService;
    let llmService: LlmService;
    let localStorageService: LocalStorageService;
    let remoteFunctionService: RemoteFunctionService;
    let registry: AssessmentHandlerRegistry;
    let discHandler: DiscAssessmentHandler;

    const mockUser = {
        id: 'test-user-id',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: 'test@example.com'
    };

    const mockSession = {
        access_token: 'mock-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: mockUser
    };

    beforeEach(async () => {
        // Set up session and user state
        session$.set(mockSession);
        user$.set(mockUser);
        expect(isAuthenticated$.get()).toBe(true); // Verify authentication state

        // Set up providers
        testAuthProvider = new TestAuthProvider();
        testDataProvider = new TestDataProvider();
        testLlmProvider = new TestLlmProvider();
        testStorageProvider = new TestStorageProvider();
        testRemoteFunctionProvider = new TestRemoteFunctionProvider();

        await testAuthProvider.initialize();
        await testDataProvider.initialize();
        await testLlmProvider.initialize();
        await testStorageProvider.initialize();
        await testRemoteFunctionProvider.initialize();

        // Register providers
        DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
        DependencyService.registerValue(STORAGE_PROVIDER_KEY, testStorageProvider);
        DependencyService.registerValue(REMOTE_FUNCTION_PROVIDER_KEY, testRemoteFunctionProvider);

        // Initialize services
        authService = new AuthService();
        dataService = new DataService();
        llmService = new LlmService();
        localStorageService = new LocalStorageService();
        remoteFunctionService = new RemoteFunctionService();
        userAssessmentService = new UserAssessmentService();
        navigationViewModel = new NavigationViewModel();

        await authService.initialize();
        await dataService.initialize();
        await llmService.initialize();
        await localStorageService.initialize();
        await remoteFunctionService.initialize();
        await userAssessmentService.initialize();
        await navigationViewModel.initialize();

        // Set up DISC handler and registry
        registry = DependencyService.resolve(AssessmentHandlerRegistry);
        await registry.initialize();
        discHandler = new DiscAssessmentHandler(mockUser.id);
        registry.registerHandler(discHandler);

        // Create and initialize view model
        discViewModel = new DiscViewModel();
        await discViewModel.initialize();

        // Reset DocumentPicker and getTextFromAssessmentFile mocks
        (DocumentPicker.getDocumentAsync as jest.Mock).mockReset();
        (getTextFromAssessmentFile as jest.Mock).mockReset();
    });

    afterEach(async () => {
        await discViewModel.end();
        await userAssessmentService.end();
        await remoteFunctionService.end();
        await localStorageService.end();
        await llmService.end();
        await dataService.end();
        await authService.end();
        await registry.end();
        await navigationViewModel.end();

        await testRemoteFunctionProvider.end();
        await testStorageProvider.end();
        await testLlmProvider.end();
        await testDataProvider.end();
        await testAuthProvider.end();

        // Clean up session and user state
        session$.set(null);
        user$.set(null);
        userAssessments$.set([]);
    });

    describe('file handling', () => {
        it('should handle file upload successfully', async () => {
            // Arrange
            const mockFile = {
                name: 'test.txt',
                uri: 'file://test.txt',
                type: 'text/plain',
                size: 1000
            };
            const mockText = 'Mocked assessment text content';
            
            (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
                canceled: false,
                assets: [mockFile]
            });
            (getTextFromAssessmentFile as jest.Mock).mockResolvedValue(ok(mockText));

            // Act
            const result = await discViewModel.handleFileUpload(() => {});

            // Assert
            expect(result.isOk()).toBe(true);
            expect(discViewModel.error$.get()).toBeNull();
            expect(discViewModel.discFullTextResult$.get()).toBe(mockText);
        });

        it('should handle file upload with PDF', async () => {
            // Arrange
            const mockFile = {
                name: 'test.pdf',
                uri: 'file://test.pdf',
                type: 'application/pdf',
                size: 1000
            };
            const mockText = 'Mocked PDF content';
            
            (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
                canceled: false,
                assets: [mockFile]
            });
            (getTextFromAssessmentFile as jest.Mock).mockResolvedValue(ok(mockText));

            // Act
            const result = await discViewModel.handleFileUpload(() => {});

            // Assert
            expect(result.isOk()).toBe(true);
            expect(discViewModel.error$.get()).toBeNull();
            expect(discViewModel.discFullTextResult$.get()).toBe(mockText);
        });

        it('should handle file upload with image', async () => {
            // Arrange
            const mockFile = {
                name: 'test.jpg',
                uri: 'file://test.jpg',
                type: 'image/jpeg',
                size: 1000
            };
            const mockText = 'Mocked OCR text content';
            
            (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
                canceled: false,
                assets: [mockFile]
            });
            (getTextFromAssessmentFile as jest.Mock).mockResolvedValue(ok(mockText));

            // Act
            const result = await discViewModel.handleFileUpload(() => {});

            // Assert
            expect(result.isOk()).toBe(true);
            expect(discViewModel.error$.get()).toBeNull();
            expect(discViewModel.discFullTextResult$.get()).toBe(mockText);
        });

        it('should handle file upload cancellation', async () => {
            // Arrange
            (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
                canceled: true
            });

            // Act
            const result = await discViewModel.handleFileUpload(() => {});

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(false);
            }
        });

        it('should handle file removal', async () => {
            // Act
            const result = await discViewModel.removeFile('test.txt');

            // Assert
            expect(result.isOk()).toBe(true);
        });
    });

    describe('full workflow', () => {
        it('should process an assessment', async () => {
            // Arrange
            const scores = [
                { name: 'Dominance', score: '80' },
                { name: 'Influence', score: '75' },
                { name: 'Steadiness', score: '60' },
                { name: 'Conscientiousness', score: '85' }
            ];
            discViewModel.scores$.set(scores);

            // Act
            const results = await discViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(discViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(discViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
        });

        it('should process an assessment with text', async () => {
            // Arrange
            const scores = [
                { name: 'Dominance', score: '80' },
                { name: 'Influence', score: '75' },
                { name: 'Steadiness', score: '60' },
                { name: 'Conscientiousness', score: '85' }
            ];
            discViewModel.scores$.set(scores);
            discViewModel.discFullTextResult$.set("Detailed DISC assessment text");

            // Act
            const results = await discViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(discViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(discViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
            expect(userAssessments$[0].assessment_full_text.get()).toBeTruthy();
        });

        it('should handle submission with invalid scores', async () => {
            // Arrange
            const scores = [
                { name: 'Dominance', score: '80' },
                { name: 'Influence', score: '' }, // Invalid empty score
                { name: 'Steadiness', score: '60' },
                { name: 'Conscientiousness', score: '85' }
            ];
            discViewModel.scores$.set(scores);

            // Act
            const results = await discViewModel.submitAssessment();

            // Assert
            expect(results.isErr()).toBe(true);
            expect(discViewModel.error$.get()).toBe('Please enter all DISC scores before submitting');
        });
    });

    describe('isSubmitEnabled', () => {
        it('should return true when all scores are filled', () => {
            // Arrange
            const scores = [
                { name: 'Dominance', score: '80' },
                { name: 'Influence', score: '75' },
                { name: 'Steadiness', score: '60' },
                { name: 'Conscientiousness', score: '85' }
            ];
            discViewModel.scores$.set(scores);

            // Act
            const result = discViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when not all scores are filled', () => {
            // Arrange
            const scores = [
                { name: 'Dominance', score: '80' },
                { name: 'Influence', score: '' },
                { name: 'Steadiness', score: '60' },
                { name: 'Conscientiousness', score: '85' }
            ];
            discViewModel.scores$.set(scores);

            // Act
            const result = discViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when scores are out of range', () => {
            // Arrange
            const scores = [
                { name: 'Dominance', score: '80' },
                { name: 'Influence', score: '150' }, // Out of range
                { name: 'Steadiness', score: '60' },
                { name: 'Conscientiousness', score: '85' }
            ];
            discViewModel.scores$.set(scores);

            // Act
            const result = discViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('updateScore', () => {
        it('should update score value', () => {
            // Act
            discViewModel.updateScore(0, '80');

            // Assert
            expect(discViewModel.scores$[0].score.get()).toBe('80');
        });

        it('should handle empty score value', () => {
            // Act
            discViewModel.updateScore(0, '');

            // Assert
            expect(discViewModel.scores$[0].score.get()).toBe('');
        });

        it('should maintain index when updating score', () => {
            // Act
            discViewModel.updateScore(2, '60');

            // Assert
            const score = discViewModel.scores$[2].get();
            expect(score.name).toBe('Steadiness');
            expect(score.score).toBe('60');
        });

        it('should clamp values between 0 and 100', () => {
            // Test values below 0
            discViewModel.updateScore(0, '-10');
            expect(discViewModel.scores$[0].score.get()).toBe('0');

            // Test values above 100
            discViewModel.updateScore(0, '150');
            expect(discViewModel.scores$[0].score.get()).toBe('100');

            // Test valid values
            discViewModel.updateScore(0, '75');
            expect(discViewModel.scores$[0].score.get()).toBe('75');
        });
    });
}); 