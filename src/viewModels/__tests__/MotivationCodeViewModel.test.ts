import { MotivationCodeViewModel } from '../MotivationCodeViewModel';
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
import {MotivationCodeAssessmentHandler} from "@src/providers/assessment/handlers/MotivationCodeAssessmentHandler";

describe('MotivationCodeViewModel', () => {
    let motivationCodeViewModel: MotivationCodeViewModel;
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

        // Set up registry
        registry = DependencyService.resolve(AssessmentHandlerRegistry);
        await registry.initialize();

        // Create the Motivation Code handler
        const motivationCodeHandler = new MotivationCodeAssessmentHandler(mockUser.id);
        registry.registerHandler(motivationCodeHandler);

        // Create and initialize view model
        motivationCodeViewModel = new MotivationCodeViewModel();
        await motivationCodeViewModel.initialize();

        // Reset DocumentPicker and getTextFromAssessmentFile mocks
        (DocumentPicker.getDocumentAsync as jest.Mock).mockReset();
        (getTextFromAssessmentFile as jest.Mock).mockReset();
    });

    afterEach(async () => {
        await motivationCodeViewModel.end();
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
            const result = await motivationCodeViewModel.handleFileUpload(() => {});

            // Assert
            expect(result.isOk()).toBe(true);
            expect(motivationCodeViewModel.error$.get()).toBeNull();
        });

        it('should handle file upload cancellation', async () => {
            // Arrange
            (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
                canceled: true
            });

            // Act
            const result = await motivationCodeViewModel.handleFileUpload(() => {});

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(false);
            }
        });

        it('should handle file removal', async () => {
            // Act
            const result = await motivationCodeViewModel.removeFile('test.txt');

            // Assert
            expect(result.isOk()).toBe(true);
        });
    });

    describe('motivation handling', () => {
        it('should update motivation at specific index', () => {
            // Act
            motivationCodeViewModel.updateMotivation(0, 'Achievement');

            // Assert
            expect(motivationCodeViewModel.motivations$.get()[0]).toBe('Achievement');
        });

        it('should handle empty motivation value', () => {
            // Act
            motivationCodeViewModel.updateMotivation(0, '');

            // Assert
            expect(motivationCodeViewModel.motivations$.get()[0]).toBe('');
        });

        it('should maintain array length when updating motivations', () => {
            // Arrange
            const initialLength = motivationCodeViewModel.motivations$.get().length;

            // Act
            motivationCodeViewModel.updateMotivation(2, 'Growth');

            // Assert
            expect(motivationCodeViewModel.motivations$.get().length).toBe(initialLength);
        });
    });

    describe('full workflow', () => {
        it('should process an assessment with valid motivations', async () => {
            // Arrange
            const motivations = ['Achievement', 'Growth', 'Impact', 'Innovation', 'Leadership'];
            motivations.forEach((motivation, index) => {
                motivationCodeViewModel.updateMotivation(index, motivation);
            });

            // Act
            const results = await motivationCodeViewModel.submitAssessment();

            // Assert
            expect(results.isOk()).toBe(true);
            expect(motivationCodeViewModel.error$.get()).toBeNull();
        });

        it('should handle submission with incomplete motivations', async () => {
            // Arrange
            motivationCodeViewModel.updateMotivation(0, 'Achievement');
            // Leave other motivations empty

            // Act
            const results = await motivationCodeViewModel.submitAssessment();

            // Assert
            expect(results.isErr()).toBe(true);
            expect(motivationCodeViewModel.error$.get()).toBeTruthy();
        });

        it('should handle submission with invalid motivations', async () => {
            // Arrange
            const invalidMotivations = ['Invalid1', 'Invalid2', 'Invalid3', 'Invalid4', 'Invalid5'];
            invalidMotivations.forEach((motivation, index) => {
                motivationCodeViewModel.updateMotivation(index, motivation);
            });

            // Act
            const results = await motivationCodeViewModel.submitAssessment();

            // Assert
            expect(results.isErr()).toBe(true);
            expect(motivationCodeViewModel.error$.get()).toBeTruthy();
        });
    });
}); 