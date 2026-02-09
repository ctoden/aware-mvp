# ChangeEvent System

## Overview

The ChangeEvent system provides a centralized way for services to react to important state changes across the application. It improves upon the previous ModelChangeEvent system by focusing on application state changes rather than just model data changes, offering a more versatile approach to event handling.

## Key Components

### 1. ChangeEvent

A standardized event structure that includes:
- `type`: The type of state change (from `ChangeType` enum)
- `payload`: The data associated with the change
- `timestamp`: When the change occurred
- `source`: The source of the change ('user_action', 'system', or 'api')

### 2. ChangeType

An enum defining all the different types of state changes that services can emit or listen for, including:
- `USER_ASSESSMENT`
- `USER_PROFILE`
- `FTUX` (First Time User Experience)
- `AUTH`
- `MOTIVATIONS`
- And many others...

### 3. EventAwareService

A base service class that:
- Extends the standard `Service` class
- Subscribes to state change events
- Filters for the event types the service cares about
- Delegates handling to the `onStateChange` method

### 4. ChangeEventUtils

A utility class that provides helper functions for working with ChangeEvents:
- `isChangeTypeOneOf`: Checks if a change event is of one of the specified types
- `isChangeTypeExactly`: Checks if a change event is exactly of a specified type
- `isChangeSourceOneOf`: Checks if a change event came from one of the specified sources

## How to Use

### Emitting Change Events

To notify the system that a state has changed:

```typescript
import { ChangeType, emitChange } from "@src/events/ChangeEvent";

// When a user completes an assessment
emitChange(ChangeType.USER_ASSESSMENT, assessmentData, 'user_action');

// When auth state changes
emitChange(ChangeType.AUTH, user, 'system');

// When FTUX progress changes
emitChange(ChangeType.FTUX, { step: 'completed_step', data: stepData }, 'user_action');
```

### Consuming Change Events

1. Extend `EventAwareService` instead of `Service`:

```typescript
import { EventAwareService } from "./EventAwareService";
import { ChangeType } from "@src/events/ChangeEvent";

@singleton()
export class MyService extends EventAwareService {
  constructor() {
    // Specify which change types this service cares about
    super('MyService', [
      ChangeType.USER_ASSESSMENT,
      ChangeType.FTUX
    ]);
  }
}
```

2. Implement the `onStateChange` method:

```typescript
protected async onStateChange(event: ChangeEvent): Promise<void> {
  switch (event.type) {
    case ChangeType.USER_ASSESSMENT:
      // Handle assessment changes
      await this.processAssessmentUpdate(event.payload);
      break;
    
    case ChangeType.FTUX:
      // Handle FTUX changes
      await this.handleFtuxChange(event.payload);
      break;
  }
}
```

3. Implement custom subscriptions if needed:

```typescript
protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
  // Subscribe to observables if needed
  this.onChange(someObservable$, async (change) => {
    // Handle change...
  });
  
  return ok(true);
}
```

### Using ChangeEventUtils

The ChangeEventUtils provides helper functions to make working with ChangeEvents easier:

```typescript
import { ChangeEventUtils } from "@src/utils/ChangeEventUtils";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";

protected async onStateChange(event: ChangeEvent): Promise<void> {
  // Check if event is one of multiple types
  if (ChangeEventUtils.isChangeTypeOneOf(event, [ChangeType.AUTH, ChangeType.USER_PROFILE])) {
    // Handle auth or profile changes
  }
  
  // Check if event is exactly a specific type
  if (ChangeEventUtils.isChangeTypeExactly(event, ChangeType.FTUX)) {
    // Handle FTUX changes
  }
  
  // Check if event came from a specific source
  if (ChangeEventUtils.isChangeSourceOneOf(event, ['user_action'])) {
    // Handle user-initiated changes
  }
}
```

## Best Practices

1. **Be Specific with Event Types**: Only subscribe to the event types your service actually needs to handle.

2. **Keep Handlers Focused**: Each handler in your `onStateChange` method should have a single responsibility.

3. **Consider Event Source**: Use the `source` property to differentiate between user-initiated, system, and API changes when appropriate.

4. **Use ChangeEventUtils**: Leverage the utility functions to simplify your event handling logic.

5. **Avoid Side Effects**: Event handlers should avoid triggering additional events when possible to prevent cascading updates.

6. **Async Handling**: All event handlers should be async to ensure proper handling of asynchronous operations.

## Integration with GenerateDataService

The ChangeEvent system integrates with the GenerateDataService to provide a structured way to register actions that should be triggered in response to specific change events:

```typescript
// Register actions with GenerateDataService
this._generateDataService.registerActions(ChangeType.AUTH, [
    new FetchUserDataAction(this)
]);

this._generateDataService.registerActions(ChangeType.USER_PROFILE_GENERATE_SUMMARY, [
    new GenerateUserSummaryAction(this)
]);
```

This approach centralizes the handling of complex action sequences that need to be triggered by specific change events.
