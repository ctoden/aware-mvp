import { INTRO_STEP_CONTENT, IntroViewModel } from '../IntroViewModel';
import { DependencyService } from '@src/core/injection/DependencyService';
import { TestStorageProvider } from '@src/providers/storage/__tests__/TestStorageProvider';
import { STORAGE_PROVIDER_KEY } from '@src/providers/storage/StorageProvider';
import { LocalStorageService } from '@src/services/LocalStorageService';
import { initializeViewModel } from '../ViewModel';
import { FtuxModel, ftuxState$, INTRO_COMPLETED_KEY } from '@src/models/FtuxModel';
import { FtuxService } from '@src/services/FtuxService';

describe('IntroViewModel', () => {
    let viewModel: IntroViewModel;
    let ftuxModel: FtuxModel;
    let ftuxService: FtuxService;
    let storageService: LocalStorageService;
    let testStorageProvider: TestStorageProvider;

    beforeEach(async () => {
        // Create and initialize the test provider
        testStorageProvider = new TestStorageProvider();
        await testStorageProvider.initialize();
        
        // Register the provider
        DependencyService.registerValue(STORAGE_PROVIDER_KEY, testStorageProvider);
        
        // Create and initialize the storage service
        storageService = DependencyService.resolve(LocalStorageService);
        await storageService.initialize();

        // Create and initialize the FTUX model
        ftuxModel = DependencyService.resolve(FtuxModel);
        await ftuxModel.initialize();

        // Create and initialize the FTUX service
        ftuxService = DependencyService.resolve(FtuxService);
        await ftuxService.initialize();

        // Create and initialize the view model
        viewModel = new IntroViewModel();
        await initializeViewModel(viewModel);

        // Reset FTUX state
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.currentStep.set(0);
    });

    afterEach(async () => {
        await viewModel.end();
        await ftuxService.end();
        await ftuxModel.end();
        await storageService.end();
        await testStorageProvider.end();
    });

    describe('step management', () => {
        it('should start at step 0', () => {
            expect(viewModel.currentStep).toBe(0);
        });

        it('should have correct total steps', () => {
            expect(viewModel.totalSteps).toBe(3);
        });

        it('should increment step when calling nextStep', () => {
            viewModel.nextStep();
            expect(viewModel.currentStep).toBe(1);
        });

        it('should not increment beyond last step', () => {
            ftuxState$.currentStep.set(2);
            viewModel.nextStep();
            expect(viewModel.currentStep).toBe(2);
        });

        it('should correctly identify last step', () => {
            expect(viewModel.isLastStep()).toBe(false);
            ftuxState$.currentStep.set(2);
            expect(viewModel.isLastStep()).toBe(true);
        });
    });

    describe('intro completion', () => {
        it('should complete intro and persist to storage', async () => {
            // Act
            const result = await viewModel.completeIntro();

            // Assert
            expect(result.isOk()).toBe(true);
            expect(ftuxState$.hasCompletedIntro.get()).toBe(true);

            const storedValue = await storageService.getItem(INTRO_COMPLETED_KEY);
            expect(storedValue.isOk()).toBe(true);
            if (storedValue.isOk()) {
                expect(storedValue.value).toBe('true');
            }
        });
    });

    describe('content', () => {
        it('should return correct content for each step', () => {
            for (let i = 0; i < viewModel.totalSteps; i++) {
                const content = viewModel.getStepContent(i);
                expect(content).toEqual(INTRO_STEP_CONTENT[i]);
            }
        });

        it('should return empty content for invalid step', () => {
            const content = viewModel.getStepContent(99);
            expect(content).toEqual({
                title: "",
                description: ""
            });
        });
    });
}); 