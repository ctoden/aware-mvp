import {SignInViewModel} from '../SignInViewModel';
import {DependencyService} from "@src/core/injection/DependencyService";
import {AUTH_PROVIDER_KEY} from "@src/providers/auth/AuthProvider";
import {TestAuthProvider} from "@src/providers/auth/__tests__/TestAuthProvider";
import {AuthService} from '@src/services/AuthService';
import {session$, user$} from "@src/models/SessionModel";
import {withViewModel} from "../ViewModel";
import {nanoid} from "nanoid";

describe('SignInViewModel', () => {
  let viewModel: SignInViewModel;
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
    viewModel = await withViewModel(SignInViewModel, nanoid(5));
  });

  afterEach(async () => {
    await viewModel.end();
    await authService.end();
    await testAuthProvider.end();
    session$.set(null);
    user$.set(null);
  });

  it('should sign in successfully', async () => {
    // Set up test data
    viewModel.email$.set('test@example.com');
    viewModel.password$.set('password');

    // Perform sign in
    await viewModel.signIn();

    // Verify successful sign in
    expect(viewModel.error$.get()).toBeNull();
    expect(viewModel.isLoading$.get()).toBe(false);
    
    // Verify session was created
    expect(session$.get()).not.toBeNull();
    expect(session$.get()?.user?.email).toBe('test@example.com');
    expect(session$.get()?.access_token).toBe('test_token');
  });

  it('should handle sign-in error', async () => {
    // Set up test data for error case
    viewModel.email$.set('error@test.com');
    viewModel.password$.set('wrong-password');

    // Perform sign in
    await viewModel.signIn();

    // Verify error handling
    expect(viewModel.error$.get()).toBe('Test error');
    expect(viewModel.isLoading$.get()).toBe(false);
    expect(session$.get()).toBeNull();
  });

  it('should validate email format', async () => {
    // Set up invalid email
    viewModel.email$.set('invalid-email');
    viewModel.password$.set('password');

    // Perform sign in
    await viewModel.signIn();

    // Verify validation error
    expect(viewModel.error$.get()).toBe('Please enter a valid email address');
    expect(viewModel.isLoading$.get()).toBe(false);
    expect(session$.get()).toBeNull();
  });

  it('should validate password is required', async () => {
    // Set up missing password
    viewModel.email$.set('test@example.com');
    viewModel.password$.set('');

    // Perform sign in
    await viewModel.signIn();

    // Verify validation error
    expect(viewModel.error$.get()).toBe('Password is required');
    expect(viewModel.isLoading$.get()).toBe(false);
    expect(session$.get()).toBeNull();
  });

  it('should set loading state during sign in', async () => {
    // Set up test data
    viewModel.email$.set('test@example.com');
    viewModel.password$.set('password');

    // Start sign in but don't await
    const signInPromise = viewModel.signIn();
    
    // Verify loading state is set
    expect(viewModel.isLoading$.get()).toBe(true);

    // Complete sign in
    await signInPromise;

    // Verify loading state is cleared
    expect(viewModel.isLoading$.get()).toBe(false);
  });
}); 