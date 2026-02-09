import { DependencyService } from "@src/core/injection/DependencyService";
import { AUTH_PROVIDER_KEY } from "@src/providers/auth/AuthProvider";
import { TestAuthProvider } from "@src/providers/auth/__tests__/TestAuthProvider";
import { AuthService } from '@src/services/AuthService';
import { isAuthenticated$, session$, user$ } from "../SessionModel";
import { observable } from "@legendapp/state";

describe('SessionModel', () => {
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
    });

    afterEach(async () => {
        await authService.end();
        await testAuthProvider.end();
        session$.set(null);
        user$.set(null);
    });

    describe('isAuthenticated$', () => {
        it('should be false when session is null', () => {
            expect(isAuthenticated$.get()).toBe(false);
        });

        it('should be true when session is set', () => {
            testAuthProvider.setSession({
                access_token: 'test_token',
                user: {
                    id: 'test_user_id',
                    email: 'test@example.com'
                }
            });

            expect(isAuthenticated$.get()).toBe(true);
        });

        it('should update reactively when session changes', () => {
            let count = 0;
            const test$ = observable(() => isAuthenticated$.get());
            test$.onChange(() => count++);

            // Initially false
            expect(test$.get()).toBe(false);

            // Set session
            testAuthProvider.setSession({
                access_token: 'test_token',
                user: {
                    id: 'test_user_id',
                    email: 'test@example.com'
                }
            });
            expect(test$.get()).toBe(true);
            expect(count).toBe(1);

            // Clear session
            testAuthProvider.setSession(null);
            expect(test$.get()).toBe(false);
            expect(count).toBe(2);

            test$.delete();
        });

        it('should update when auth service changes session', async () => {
            // Sign in via auth service
            const result = await authService.signIn('test@example.com', 'password');
            expect(result.isOk()).toBe(true);
            expect(isAuthenticated$.get()).toBe(true);

            // Sign out
            const signOutResult = await authService.signOut();
            expect(signOutResult.isOk()).toBe(true);
            expect(isAuthenticated$.get()).toBe(false);
        });
    });
}); 