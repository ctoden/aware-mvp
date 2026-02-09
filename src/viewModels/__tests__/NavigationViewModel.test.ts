import {NavigationViewModel} from '../NavigationViewModel';
import {DependencyService} from '@src/core/injection/DependencyService';
import {TestAuthProvider} from '@src/providers/auth/__tests__/TestAuthProvider';
import {AUTH_PROVIDER_KEY} from '@src/providers/auth/AuthProvider';
import {AuthService} from '@src/services/AuthService';
import {isAuthenticated$, session$} from '@src/models/SessionModel';
import {initializeViewModel} from '../ViewModel';
import {UserProfile, userProfile$} from '@src/models/UserProfile';
import {userAssessments$, UserAssessment} from '@src/models/UserAssessment';
import {NavigationModel, navigationModel, FTUX_Routes, Layouts} from '@src/models/NavigationModel';
import {observable} from '@legendapp/state';
import {LocalStorageService} from '@src/services/LocalStorageService';
import {TestStorageProvider} from '@src/providers/storage/__tests__/TestStorageProvider';
import {STORAGE_PROVIDER_KEY} from '@src/providers/storage/StorageProvider';
import { FtuxModel, ftuxState$, INTRO_COMPLETED_KEY } from '@src/models/FtuxModel';
import { FtuxService } from '@src/services/FtuxService';

describe('NavigationViewModel', () => {
    let viewModel: NavigationViewModel;
    let testAuthProvider: TestAuthProvider;
    let authService: AuthService;
    let storageService: LocalStorageService;
    let testStorageProvider: TestStorageProvider;
    let ftuxModel: FtuxModel;
    let ftuxService: FtuxService;

    beforeAll(() => {
        // Initialize observables if they haven't been already
        if (!isAuthenticated$) {
            (globalThis as any).isAuthenticated$ = observable(false);
        }
        if (!userProfile$) {
            (globalThis as any).userProfile$ = observable<UserProfile | null>(null);
        }
        if (!userAssessments$) {
            (globalThis as any).userAssessments$ = observable<UserAssessment[]>([]);
        }
        // Initialize navigation model
        if (!(globalThis as any).navigationModel) {
            (globalThis as any).navigationModel = observable<NavigationModel>({
                isLargeScreen: true,
                breakpoint: 600,
                frozenRoute: null
            });
        }
        // Initialize ftux state
        if (!(globalThis as any).ftuxState$) {
            (globalThis as any).ftuxState$ = observable({
                hasCompletedIntro: false,
                hasCompletedFTUX: false,
                currentStep: 0
            });
        }
    });

    beforeEach(async () => {
        // Create and initialize the test providers
        testAuthProvider = new TestAuthProvider();
        await testAuthProvider.initialize();
        
        testStorageProvider = new TestStorageProvider();
        await testStorageProvider.initialize();
        
        // Register the providers
        DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
        DependencyService.registerValue(STORAGE_PROVIDER_KEY, testStorageProvider);
        
        // Create and initialize the services
        authService = DependencyService.resolve(AuthService);
        await authService.initialize();
        
        storageService = DependencyService.resolve(LocalStorageService);
        await storageService.initialize();

        // Initialize FtuxModel and FtuxService
        ftuxModel = DependencyService.resolve(FtuxModel);
        await ftuxModel.initialize();
        
        ftuxService = DependencyService.resolve(FtuxService);
        await ftuxService.initialize();
        
        // Create and initialize the view model
        viewModel = new NavigationViewModel();
        await initializeViewModel(viewModel);
        
        // Reset some states
        isAuthenticated$.set(false);
        userAssessments$.set([]);
        userProfile$.set(null);
        navigationModel.frozenRoute.set(null);
        navigationModel.isLargeScreen.set(true);
        ftuxState$.hasCompletedIntro.set(false);
        ftuxState$.hasCompletedFTUX.set(false);
        ftuxState$.currentStep.set(0);
    });

    afterEach(async () => {
        // Clean up
        await authService.end();
        await testAuthProvider.end();
        await storageService.end();
        await testStorageProvider.end();
        await viewModel.end();
        session$.set(null);
    });

    describe('currentRoute$', () => {
        it('should return Intro when intro is not completed', () => {
            // Arrange
            ftuxState$.hasCompletedIntro.set(false);

            // Assert
            expect(viewModel.currentRoute$.get()).toBe(FTUX_Routes.Intro);
        });

        it('should return Auth when intro is completed but not authenticated', () => {
            // Arrange
            ftuxState$.hasCompletedIntro.set(true);
            isAuthenticated$.set(false);

            // Assert
            expect(viewModel.currentRoute$.get()).toBe(FTUX_Routes.Auth);
        });

        it('should return Welcome when intro completed, authenticated with profile but no assessments', () => {
            // Arrange
            ftuxState$.hasCompletedIntro.set(true);
            isAuthenticated$.set(true);
            userAssessments$.set([]);

            // Assert
            expect(viewModel.currentRoute$.get()).toBe(FTUX_Routes.Welcome);
        });
    });

    describe('screen size handling', () => {
        it('should update isLargeScreen based on screen width', () => {
            // Arrange
            const breakpoint = navigationModel.breakpoint.get();
            
            // Act & Assert - Large screen
            viewModel.updateScreenSize(breakpoint + 100);
            expect(navigationModel.isLargeScreen.get()).toBe(true);
            expect(viewModel.getCurrentLayout()).toBe(Layouts.Navbar);
            
            // Act & Assert - Small screen
            viewModel.updateScreenSize(breakpoint - 100);
            expect(navigationModel.isLargeScreen.get()).toBe(false);
            expect(viewModel.getCurrentLayout()).toBe(Layouts.Tabs);
        });
    });

    describe('initialization', () => {
        it('should load intro completion state from storage on initialization', async () => {
            // Arrange
            await storageService.setItem(INTRO_COMPLETED_KEY, 'true');
            const newViewModel = new NavigationViewModel();

            // Act
            await newViewModel.initialize();

            // Assert
            expect(ftuxState$.hasCompletedIntro.get()).toBe(true);

            await newViewModel.end();
        });
    });
}); 