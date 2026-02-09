import {SessionViewModel} from '../SessionViewModel';
import {DependencyService} from "@src/core/injection/DependencyService";
import {observable} from "@legendapp/state";
import {isAuthenticated$, session$, user$} from "@src/models/SessionModel";
import {AUTH_PROVIDER_KEY} from "@src/providers/auth/AuthProvider";
import {TestAuthProvider} from "@src/providers/auth/__tests__/TestAuthProvider";
import {AuthService} from '@src/services/AuthService';
import {createMockSessionModel} from '@src/__tests__/mockUtils';

describe('SessionViewModel', () => {
  let viewModel: SessionViewModel;
  let testAuthProvider: TestAuthProvider;
  let authService: AuthService;

  beforeEach(async () => {
    // Reset auth models
    session$.set(null);
    user$.set(null);

    // Setup test auth provider
    testAuthProvider = new TestAuthProvider();
    await testAuthProvider.initialize();
    DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);

    // Setup auth service
    authService = new AuthService();
    await authService.initialize();

    // Setup view model
    viewModel = new SessionViewModel();
    await viewModel.initialize();
  });

  afterEach(async () => {
    await viewModel.end();
    await authService.end();
    await testAuthProvider.end();
    session$.set(null);
    user$.set(null);
  });

  describe('initialization', () => {
    it('should initialize and sync with session$ observable', async () => {
      const mockSession = createMockSessionModel();

      // Set session via provider
      testAuthProvider.setSession({
        access_token: mockSession.access_token,
        user: mockSession.user
      });

      // Verify session$ was updated
      expect(session$.get()).toMatchObject({
        access_token: mockSession.access_token,
        user: expect.objectContaining({
          id: mockSession.user!.id,
          email: mockSession.user!.email
        })
      });
    });
  });

  describe('auth state changes', () => {
    it('should update session$ and user$ on auth state change', async () => {
      const mockSession = createMockSessionModel();

      // Simulate auth state change
      testAuthProvider.setSession({
        access_token: mockSession.access_token,
        user: mockSession.user
      });

      // Verify observables were updated
      expect(session$.get()).toMatchObject({
        access_token: mockSession.access_token,
        user: expect.objectContaining({
          id: mockSession.user!.id,
          email: mockSession.user!.email
        })
      });
      expect(user$.get()).toMatchObject({
        id: mockSession.user!.id,
        email: mockSession.user!.email
      });

      // Test clearing session
      testAuthProvider.setSession(null);
      expect(session$.get()).toBeNull();
      expect(user$.get()).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should handle successful signout', async () => {
      // First set a session
      const mockSession = createMockSessionModel();
      testAuthProvider.setSession({
        access_token: mockSession.access_token,
        user: mockSession.user
      });

      // Verify initial state
      expect(session$.get()).not.toBeNull();
      expect(viewModel.isLoading$.get()).toBe(false);
      expect(viewModel.error$.get()).toBeNull();

      // Perform signout
      await viewModel.signOut();

      // Verify final state
      expect(session$.get()).toBeNull();
      expect(viewModel.isLoading$.get()).toBe(false);
      expect(viewModel.error$.get()).toBeNull();
    });

    it('should handle signout error', async () => {
      // Setup error condition (not signed in)
      testAuthProvider.setSession(null);

      // Perform signout
      await viewModel.signOut();

      // Verify error handling
      expect(viewModel.isLoading$.get()).toBe(false);
      expect(viewModel.error$.get()).toBe('Not signed in');
    });
  });

  describe("isAuthenticated$ observable", () => {
    it("should update when session changes", async () => {
      const mockSession = createMockSessionModel();

      let count = 0;
      const test$ = observable(() => {
        return isAuthenticated$.get() === true;
      });

      test$.onChange(() => count++);

      // Set session
      testAuthProvider.setSession({
        access_token: mockSession.access_token,
        user: mockSession.user
      });
      expect(isAuthenticated$.get()).toBe(true);
      expect(test$.get()).toBe(true);
      expect(count).toBe(1);

      // Clear session
      testAuthProvider.setSession(null);
      expect(isAuthenticated$.get()).toBe(false);
      expect(count).toBe(2);

      // Set session again
      testAuthProvider.setSession({
        access_token: mockSession.access_token,
        user: mockSession.user
      });
      expect(isAuthenticated$.get()).toBe(true);
      expect(count).toBe(3);

      test$.delete();
    });
  });
}); 