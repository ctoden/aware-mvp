import {SignUpViewModel} from '../SignUpViewModel';
import {DependencyService} from "@src/core/injection/DependencyService";
import {AUTH_PROVIDER_KEY} from "@src/providers/auth/AuthProvider";
import {TestAuthProvider} from "@src/providers/auth/__tests__/TestAuthProvider";
import {AuthService} from '@src/services/AuthService';
import {session$, user$} from "@src/models/SessionModel";
import {withViewModel} from "../ViewModel";
import {nanoid} from "nanoid";
import { userProfile$ } from '@src/models/UserProfile';

describe('SignUpViewModel', () => {
  let viewModel: SignUpViewModel;
  let testAuthProvider: TestAuthProvider;

  beforeEach(async () => {
    // Reset auth models
    session$.set(null);
    user$.set(null);

    // Setup test auth provider
    testAuthProvider = new TestAuthProvider();
    await testAuthProvider.initialize();
    DependencyService.registerValue(AUTH_PROVIDER_KEY, testAuthProvider);

    // Setup view model
    viewModel = await withViewModel(SignUpViewModel, nanoid(5));
  });

  afterEach(async () => {
    await viewModel.end();
    await testAuthProvider.end();
    session$.set(null);
    user$.set(null);
  });

  it('should sign up successfully', async () => {
    // Set up test data
    viewModel.email$.set('test@example.com');
    viewModel.password$.set('password123');
    viewModel.confirmPassword$.set('password123');
    viewModel.fullName$.set('Test User');

    // Perform sign up
    const result = await viewModel.signUp();

    // Verify successful sign up
    expect(result.isOk()).toBe(true);
    expect(viewModel.error$.get()).toBeNull();
    expect(viewModel.isLoading$.get()).toBe(false);
    
    // Verify session was created
    expect(session$.get()).not.toBeNull();
    expect(session$.get()?.user?.email).toBe('test@example.com');
    expect(userProfile$.get()?.full_name).toBe('Test User');
    expect(session$.get()?.access_token).toBe('test_token');
  });

  it('should handle sign-up error', async () => {
    // Set up test data for error case
    viewModel.email$.set('error@test.com');
    viewModel.password$.set('password123');
    viewModel.confirmPassword$.set('password123');
    viewModel.fullName$.set('Test User');

    // Perform sign up
    const result = await viewModel.signUp();

    // Verify error handling
    expect(result.isErr()).toBe(true);
    expect(viewModel.error$.get()).toBe('Test error');
    expect(viewModel.isLoading$.get()).toBe(false);
    expect(session$.get()).toBeNull();
  });

  it('should validate required fields', async () => {
    // Set up test data with missing required fields
    viewModel.email$.set('test@example.com');
    viewModel.password$.set('password123');
    viewModel.confirmPassword$.set('password123');
    // Deliberately omit fullName

    // Perform sign up
    const result = await viewModel.signUp();

    // Verify validation error
    expect(result.isErr()).toBe(true);
    expect(viewModel.error$.get()).toBe('Full Name is required');
    expect(viewModel.isLoading$.get()).toBe(false);
    expect(session$.get()).toBeNull();
  });

  it('should handle non-matching passwords', async () => {
    // Set up test data
    viewModel.email$.set('test@example.com');
    viewModel.password$.set('password1');
    viewModel.confirmPassword$.set('password2');
    viewModel.fullName$.set('Test User');

    // Perform sign up
    const result = await viewModel.signUp();

    // Verify validation error
    expect(result.isErr()).toBe(true);
    expect(viewModel.error$.get()).toBe('Passwords do not match');
    expect(viewModel.isLoading$.get()).toBe(false);
    expect(session$.get()).toBeNull();
  });

  it('should validate email format', async () => {
    // Set up invalid email
    viewModel.email$.set('invalid-email');
    viewModel.password$.set('password123');
    viewModel.confirmPassword$.set('password123');
    viewModel.fullName$.set('Test User');

    // Perform sign up
    const result = await viewModel.signUp();

    // Verify validation error
    expect(result.isErr()).toBe(true);
    expect(viewModel.error$.get()).toBe('Please enter a valid email address');
    expect(viewModel.isLoading$.get()).toBe(false);
    expect(session$.get()).toBeNull();
  });

  it('should validate password length', async () => {
    // Set up short password
    viewModel.email$.set('test@example.com');
    viewModel.password$.set('12345');
    viewModel.confirmPassword$.set('12345');
    viewModel.fullName$.set('Test User');

    // Perform sign up
    const result = await viewModel.signUp();

    // Verify validation error
    expect(result.isErr()).toBe(true);
    expect(viewModel.error$.get()).toBe('Password must be at least 6 characters long');
    expect(viewModel.isLoading$.get()).toBe(false);
    expect(session$.get()).toBeNull();
  });

  it('should set loading state during sign up', async () => {
    // Set up test data
    viewModel.email$.set('test@example.com');
    viewModel.password$.set('password123');
    viewModel.confirmPassword$.set('password123');
    viewModel.fullName$.set('Test User');

    // Start sign up but don't await
    const signUpPromise = viewModel.signUp();
    
    // Verify loading state is set
    expect(viewModel.isLoading$.get()).toBe(true);

    // Complete sign up
    await signUpPromise;

    // Verify loading state is cleared
    expect(viewModel.isLoading$.get()).toBe(false);
  });
}); 