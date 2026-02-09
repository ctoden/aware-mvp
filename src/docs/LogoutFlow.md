# Centralized Logout Flow

## Overview

The logout flow in the Aware MVP application has been centralized to ensure consistent behavior across all parts of the application. The flow follows the MVVM architecture pattern:

- **View Layer**: UI components call the logout method on NavigationViewModel
- **ViewModel Layer**: NavigationViewModel coordinates the logout process
- **Service Layer**: AuthService handles the actual logout and state cleanup

## Implementation Details

### AuthService

The `AuthService` is responsible for:

- Clearing all relevant observable state
- Clearing local storage
- Performing the actual auth logout via the provider
- Emitting the LOGOUT event for other services to react to

```typescript
// AuthService.ts
async signOut(preserveUserData: boolean = false): Promise<Result<boolean, AuthError>> {
    try {
        // 1. Clear AsyncStorage
        // 2. Clear all observable state
        // 3. Perform the actual auth logout
        // 4. Emit LOGOUT event
        return result;
    } catch (error) {
        return err(error);
    }
}
```

### NavigationViewModel

The `NavigationViewModel` coordinates the logout process:

- Resets FTUX and navigation state
- Calls AuthService to perform the actual logout
- Handles errors and returns a Result type

```typescript
// NavigationViewModel.ts
async logout(preserveUserData: boolean = false): Promise<Result<boolean, Error>> {
    try {
        // 1. Reset navigation and FTUX state
        // 2. Perform the actual logout through auth service
        return result;
    } catch (error) {
        return err(error);
    }
}
```

### UI Components

All UI components use the same pattern to logout:

```typescript
// Any UI component
const handleLogout = async () => {
    try {
        const result = await navigationViewModel.logout();
        if (result.isErr()) {
            throw new Error(result.error.message);
        }
    } catch (error) {
        showErrorToast("Logout Failed", error.message);
    }
};
```

## Benefits of Centralization

1. **Consistency**: All UI components use the same logout flow
2. **Maintainability**: Single place to update logout logic
3. **Error Handling**: Consistent error handling across the application
4. **State Cleanup**: Ensures all app state is properly cleared on logout

## Logout Event Handling

The `LOGOUT` event can be handled by services that need to react to logout:

```typescript
// Any EventAwareService
protected async onStateChange(event: ChangeEvent): Promise<void> {
    if (event.type === ChangeType.LOGOUT) {
        // Handle logout event
    }
}
```

## Preserving User Data

The logout flow supports an optional `preserveUserData` flag that can be used to control whether user data should be preserved during logout. This is useful for temporary logouts where you want to keep the user's data.

```typescript
// Preserve user data
await navigationViewModel.logout(true);

// Clear all user data (default)
await navigationViewModel.logout();
``` 