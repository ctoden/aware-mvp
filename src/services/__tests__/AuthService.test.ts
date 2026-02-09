import { AuthService } from '@src/services/AuthService';
import { DependencyService } from '@src/core/injection/DependencyService';
import { TestAuthProvider } from '@src/providers/auth/__tests__/TestAuthProvider';
import { AUTH_PROVIDER_KEY } from '@src/providers/auth/AuthProvider';
import { GenerateDataService } from '@src/services/GenerateDataService';
import { LocalStorageService } from '@src/services/LocalStorageService';
import { session$, user$, isAuthenticated$ } from '@src/models/SessionModel';
import { userProfile$ } from '@src/models/UserProfile';
import * as ObservableUtils from '@src/utils/ObservableUtils';

// Mock ObservableUtils manually
jest.mock('@src/utils/ObservableUtils');

describe('AuthService', () => {
    let authService: AuthService;
    let testAuthProvider: TestAuthProvider;
    let mockLocalStorageService: any;
    
    // Mock implementation
    const mockSafelyClearObservables = jest.fn();

    beforeEach(() => {
        // Set up mock implementation
        (ObservableUtils.safelyClearObservables as jest.Mock).mockImplementation(mockSafelyClearObservables);
        
        // Reset mocks
        mockSafelyClearObservables.mockClear();
        
        // Reset DependencyService
        // @ts-ignore - Clear the singleton for testing
        DependencyService.container = null;
        
        // Mock LocalStorageService
        mockLocalStorageService = {
            clear: jest.fn().mockResolvedValue(undefined),
        };
        
        // Set up test providers
        testAuthProvider = new TestAuthProvider();
        
        // Register dependencies
        DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
        DependencyService.registerValue(GenerateDataService, new GenerateDataService());
        DependencyService.registerValue(LocalStorageService, mockLocalStorageService);
        
        // Initialize service
        authService = new AuthService();
    });

    describe('signOut', () => {
        it('should call safelyClearObservables with full list when preserveUserData is false', async () => {
            // Arrange
            await authService.initialize();
            
            // Clear the mock calls from initialization
            (ObservableUtils.safelyClearObservables as jest.Mock).mockClear();
            
            // Act
            await authService.signOut(false);
            
            // Assert
            expect(ObservableUtils.safelyClearObservables).toHaveBeenCalledTimes(1);
            // Check that it was called with an array containing all expected observables
            const calls = (ObservableUtils.safelyClearObservables as jest.Mock).mock.calls;
            const args = calls[0][0];
            const observablesList = args.map((item: any) => item.observable);
            
            expect(observablesList).toContain(session$);
            expect(observablesList).toContain(user$);
            expect(observablesList).toContain(isAuthenticated$);
            expect(observablesList).toContain(userProfile$);
            expect(observablesList.length).toBeGreaterThan(4); // Ensure it has more than just the auth observables
            
            expect(mockLocalStorageService.clear).toHaveBeenCalled();
        });
        
        it('should call safelyClearObservables with only auth observables when preserveUserData is true', async () => {
            // Arrange
            await authService.initialize();
            
            // Clear the mock calls from initialization
            (ObservableUtils.safelyClearObservables as jest.Mock).mockClear();
            
            // Act
            await authService.signOut(true);
            
            // Assert
            expect(ObservableUtils.safelyClearObservables).toHaveBeenCalledTimes(1);
            // Check that it was called with exactly the auth observables
            const calls = (ObservableUtils.safelyClearObservables as jest.Mock).mock.calls;
            const args = calls[0][0];
            const observablesList = args.map((item: any) => item.observable);
            
            expect(observablesList).toHaveLength(3);
            expect(observablesList).toContain(session$);
            expect(observablesList).toContain(user$);
            expect(observablesList).toContain(isAuthenticated$);
            
            expect(mockLocalStorageService.clear).not.toHaveBeenCalled();
        });
    });
});