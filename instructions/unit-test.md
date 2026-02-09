Focus on business unit testing and test driven development, meaning that all features need to be tested, but I don't
care about 'code test coverage', I care about feature coverage. DO NOT configure jest, playwright, or vite to report on coverage.

# Test Provider Pattern

Instead of using mocks, we use Test Providers that implement the provider interfaces. This approach:
- Makes tests more reliable by testing actual implementations
- Reduces test maintenance as provider interfaces evolve
- Provides consistent behavior across tests
- Makes it easier to test error conditions and edge cases

## Services
Our application uses the following services:
- AppInitializationService
- MistralAiService
- RemoteFunctionService
- UserAssessmentService
- UserProfileService
- AppStateService
- AuthService
- DataService
- LlmService
- LocalStorageService

## Providers
Each service depends on providers that implement specific interfaces:
- Assessment
  - AssessmentService
  - AssessmentHandler
  - AssessmentHandlerRegistry
- LLM
  - LlmProvider
  - MistralLlmProvider
- Storage
  - StorageProvider
  - AsyncStorageProvider

## Example Test Using Test Providers

```typescript
describe('UserProfileViewModel', () => {
  let testStorageProvider: TestStorageProvider;
  let testAuthProvider: TestAuthProvider;
  let userProfileService: UserProfileService;
  let viewModel: UserProfileViewModel;

  beforeEach(() => {
    // Initialize test providers
    testStorageProvider = new TestStorageProvider();
    testAuthProvider = new TestAuthProvider();

    // Initialize service with test providers
    userProfileService = new UserProfileService(
      testStorageProvider,
      testAuthProvider
    );

    // Initialize view model with service
    viewModel = new UserProfileViewModel(userProfileService);
  });

  it('should update user profile', async () => {
    // Arrange
    const newProfile = { name: "Test User", email: "test@example.com" };
    testAuthProvider.setCurrentUser({ id: "123" });

    // Act
    const result = await viewModel.updateProfile(newProfile);

    // Assert
    expect(result.isOk()).toBe(true);
    const storedProfile = await testStorageProvider.getItem('userProfile:123');
    expect(storedProfile).toEqual(newProfile);
  });
});
```

For UI testing, use @testing-library with real ViewModels and TestProviders:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewModelProvider } from '../providers/ViewModelProvider';
import { UserProfileViewModel } from '../viewModels/UserProfileViewModel';
import { UserProfileService } from '../services/UserProfileService';

describe('UserProfileView', () => {
  let testStorageProvider: TestStorageProvider;
  let testAuthProvider: TestAuthProvider;
  let userProfileService: UserProfileService;
  let viewModel: UserProfileViewModel;

  beforeEach(async () => {
    // Initialize test providers
    testStorageProvider = new TestStorageProvider();
    testAuthProvider = new TestAuthProvider();

    // Initialize service with test providers
    userProfileService = new UserProfileService(
      testStorageProvider,
      testAuthProvider
    );

    // Initialize real view model with service
    viewModel = await withViewModel(UserProfileViewModel);
  });

  it('renders and updates profile information', async () => {
    // Arrange
    testAuthProvider.setCurrentUser({ id: "123" });
    await testStorageProvider.setItem('userProfile:123', { name: "Test User" });

    // Act
    render(
      <ViewModelProvider value={{ userProfile: viewModel }}>
        <UserProfileView />
      </ViewModelProvider>
    );

    // Assert initial state
    expect(screen.getByText("Test User")).toBeInTheDocument();

    // Act - simulate user interaction
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Updated Name" }
    });
    fireEvent.click(screen.getByText("Save"));

    // Assert updated state
    expect(await testStorageProvider.getItem('userProfile:123')).toEqual({
      name: "Updated Name"
    });
  });
});

This approach:
- Uses real ViewModels to test actual business logic
- Mocks external dependencies through TestProviders
- Tests the full integration between View and ViewModel
- Maintains the ability to control test data and scenarios
- Provides more confidence in the test results

e2e testing uses playwright and supawrite and is located in the /e2e folder.