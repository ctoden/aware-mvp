import { expect } from '@playwright/test';
import { withSupawright } from 'supawright';
import type { Database } from '@src/models/database.types';
import { AuthService } from "@src/services/AuthService";
import { DependencyService } from '@src/core/injection/DependencyService';
import { nanoid } from "nanoid";
import { SUPABASE_CLIENT_KEY } from "@src/constants";
import { APP_STATE_PROVIDER_KEY } from '@src/providers/appstate/AppStateProvider';
import { TestAppStateProvider } from '@src/providers/appstate/TestAppStateProvider';
import { AUTH_PROVIDER_KEY } from '@src/providers/auth/AuthProvider';
import { SupabaseAuthProvider } from '@src/providers/auth/SupabaseAuthProvider';
import { session$, user$ } from '@src/models/SessionModel';

const test = withSupawright<Database, 'public'>(['public']);

test.describe('Authentication Flow', () => {
    let authService: AuthService;
    let testAppStateProvider: TestAppStateProvider;
    let authProvider: SupabaseAuthProvider;

    test.beforeEach(async ({ supawright }) => {
        // Register providers
        testAppStateProvider = new TestAppStateProvider();
        authProvider = new SupabaseAuthProvider();

        // Register dependencies
        DependencyService.registerValue(APP_STATE_PROVIDER_KEY, testAppStateProvider);
        DependencyService.registerValue(SUPABASE_CLIENT_KEY, supawright.supabase());
        DependencyService.registerValue(AUTH_PROVIDER_KEY, authProvider);
        
        // Initialize services
        authService = new AuthService();
        await authService.initialize();
        await testAppStateProvider.initialize();
        await authProvider.initialize();
    });

    test.afterEach(async () => {
        // Clean up services
        await authService.signOut();
        await authService.end();
        await testAppStateProvider.end();
        await authProvider.end();

        // Reset observables
        session$.set(null);
        user$.set(null);

        // Clear DI container
        DependencyService.container().clearInstances();
    });

    test('should show sign in screen when logged out', async ({ page }) => {
        // Navigate to the app
        await page.goto('/');

        // Check for sign in elements
        await expect(page.getByPlaceholder('Email')).toBeVisible();
        await expect(page.getByPlaceholder('Password')).toBeVisible();
        await expect(page.getByText("Don't have an account? Sign Up")).toBeVisible();
    });

    test('should sign in successfully with valid credentials', async ({ page }) => {
        const password = `password-${nanoid(5)}`;
        const email = `test-${nanoid(5)}@example.com`;

        const createUserResult = await authService.signUp(email, password, {
            fullName: 'Test User',
            phoneNumber: '1234567890'}
        );
        expect(createUserResult.isOk()).toBe(true);
        if (createUserResult.isOk()) {
            const testUser = createUserResult.value.user;
            expect(testUser).toBeDefined();
            expect(testUser?.email).toBe(email);
        }

        // Navigate to the app
        await page.goto('/');

        // Fill in credentials
        await page.getByPlaceholder('Email').fill(email);
        await page.getByPlaceholder('Password').fill(password);

        // Click sign in
        await page.getByRole('button', { name: 'Sign In' }).click();

        // Verify successful login
        await expect(page.getByText('Welcome!')).toBeVisible();
    });
});