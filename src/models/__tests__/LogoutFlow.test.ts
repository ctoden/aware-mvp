import { AuthService } from '@src/services/AuthService';
import { NavigationViewModel } from '@src/viewModels/NavigationViewModel';
import { DependencyService } from '@src/core/injection/DependencyService';
import { Result, ok, err } from 'neverthrow';
import { AUTH_PROVIDER_KEY } from "@src/providers/auth/AuthProvider";
import { FTUX_Routes } from '@src/models/NavigationModel';
import { FtuxService } from '@src/services/FtuxService';
import { TestAuthProvider } from '@src/providers/auth/__tests__/TestAuthProvider';
import { AuthError } from "@supabase/supabase-js";
import { BR_TRUE } from '@src/utils/NeverThrowUtils';

// Test extension of FtuxService for tracking state changes
class TestFtuxService extends FtuxService {
  private ftuxCompletedSetCalled = false;
  
  async setFtuxCompleted(completed: boolean): Promise<Result<boolean, Error>> {
    this.ftuxCompletedSetCalled = true;
    return await super.setFtuxCompleted(completed);
  }
  
  getFtuxCompletedSetCalled(): boolean {
    return this.ftuxCompletedSetCalled;
  }
  
  resetState(): void {
    this.ftuxCompletedSetCalled = false;
  }
}

describe('Logout Flow Integration', () => {
  let navigationViewModel: NavigationViewModel;
  let authService: AuthService;
  let testAuthProvider: TestAuthProvider;
  let testFtuxService: TestFtuxService;
  
  beforeEach(async () => {
    // Reset DependencyService
    // @ts-ignore - Clear the singleton for testing
    DependencyService.container = null;
    
    // Set up TestProviders
    testAuthProvider = new TestAuthProvider();
    testFtuxService = new TestFtuxService();
    
    // Register providers with DependencyService
    DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);
    DependencyService.registerValue(FtuxService, testFtuxService);
    
    // Initialize services
    authService = new AuthService();
    await authService.initialize();
    
    // Initialize view model
    navigationViewModel = new NavigationViewModel();
    await navigationViewModel.initialize();
  });
  
  afterEach(() => {
    // Reset test state
    testFtuxService.resetState();
  });
  
  it('should properly execute the logout flow', async () => {
    // Set up test auth provider with a session
    testAuthProvider.setSession({
      access_token: 'test-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    });
    
    // Act - Call the logout method
    const result = await navigationViewModel.logout();
    
    // Assert
    expect(result.isOk()).toBe(true);
    expect(testAuthProvider.isUserAuthenticated()).toBe(false); // Verify user was logged out
    expect(testFtuxService.getFtuxCompletedSetCalled()).toBe(true); // Verify FTUX was reset
  });
  
  it('should handle errors during logout', async () => {
    // Arrange - Override signOut method to return error
    const originalSignOut = testAuthProvider.signOut;
    testAuthProvider.signOut = async () => err(new AuthError("Test error"));
    
    // Act
    const result = await navigationViewModel.logout();
    
    // Assert
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("Test error");
    }
    
    // Restore original method
    testAuthProvider.signOut = originalSignOut;
  });
}); 