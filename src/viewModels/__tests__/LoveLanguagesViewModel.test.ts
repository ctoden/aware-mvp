import { LoveLanguagesViewModel } from '../LoveLanguagesViewModel';
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
import { LoveLanguagesAssessmentHandler } from '@src/providers/assessment/handlers/LoveLanguagesAssessmentHandler';
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

describe('LoveLanguagesViewModel', () => {
    let loveLanguagesViewModel: LoveLanguagesViewModel;
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
    let loveLanguagesHandler: LoveLanguagesAssessmentHandler;

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

        // Set up Love Languages handler and registry
        registry = DependencyService.resolve(AssessmentHandlerRegistry);
        await registry.initialize();
        loveLanguagesHandler = new LoveLanguagesAssessmentHandler(mockUser.id);
        registry.registerHandler(loveLanguagesHandler);

        // Create and initialize view model
        loveLanguagesViewModel = new LoveLanguagesViewModel();
        await loveLanguagesViewModel.initialize();

        // Reset DocumentPicker and getTextFromAssessmentFile mocks
        (DocumentPicker.getDocumentAsync as jest.Mock).mockReset();
        (getTextFromAssessmentFile as jest.Mock).mockReset();
    });

    afterEach(async () => {
        await loveLanguagesViewModel.end();
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
            const result = await loveLanguagesViewModel.handleFileUpload(() => {});

            // Assert
            expect(result.isOk()).toBe(true);
            expect(loveLanguagesViewModel.error$.get()).toBeNull();
            expect(loveLanguagesViewModel.loveLanguagesFullTextResult$.get()).toBe(mockText);
        });

        it('should handle file upload cancellation', async () => {
            // Arrange
            (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
                canceled: true
            });

            // Act
            const result = await loveLanguagesViewModel.handleFileUpload(() => {});

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(false);
            }
        });

        it('should handle file removal', async () => {
            // Act
            const result = await loveLanguagesViewModel.removeFile('test.txt');

            // Assert
            expect(result.isOk()).toBe(true);
        });
    });

    describe('full workflow', () => {
        it('should process an assessment', async () => {
            // Arrange
            loveLanguagesViewModel.updateLanguage('Words of Affirmation');

            // Act
            const results = await loveLanguagesViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(loveLanguagesViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(loveLanguagesViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
        });

        it('should process an assessment with text', async () => {
            // Arrange
            loveLanguagesViewModel.updateLanguage('Quality Time');
            loveLanguagesViewModel.loveLanguagesFullTextResult$.set("Detailed Love Languages assessment text");

            // Act
            const results = await loveLanguagesViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(loveLanguagesViewModel.isMemoryUpdated$.get()).toBe(true);
            expect(loveLanguagesViewModel.error$.get()).toBeNull();
            expect(userAssessments$.length).toBeGreaterThanOrEqual(1);
            expect(userAssessments$[0].assessment_full_text.get()).toBeTruthy();
        });

        it('should handle submission with no language selected', async () => {
            // Act
            const results = await loveLanguagesViewModel.submitAssessment();

            // Assert
            expect(results.isErr()).toBe(true);
            expect(loveLanguagesViewModel.error$.get()).toBe('Please select a Love Language before submitting');
        });
    });

    describe('isSubmitEnabled', () => {
        it('should return true when language is selected', () => {
            // Arrange
            loveLanguagesViewModel.updateLanguage('Physical Touch');

            // Act
            const result = loveLanguagesViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when no language is selected', () => {
            // Act
            const result = loveLanguagesViewModel.isSubmitEnabled();

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('updateLanguage', () => {
        it('should update selected language', () => {
            // Act
            loveLanguagesViewModel.updateLanguage('Acts of Service');

            // Assert
            expect(loveLanguagesViewModel.selectedLanguage$.get()).toBe('Acts of Service');
        });

        it('should handle empty language value', () => {
            // Act
            loveLanguagesViewModel.updateLanguage('');

            // Assert
            expect(loveLanguagesViewModel.selectedLanguage$.get()).toBe('');
        });
    });
}); 