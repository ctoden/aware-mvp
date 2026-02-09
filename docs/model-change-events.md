# Model Change Event System (DEPRECATED)

> **IMPORTANT**: This documentation describes the deprecated `ModelChangeEvent` system, which has been replaced by the `ChangeEvent` system. Please refer to the [ChangeEvent Migration Guide](./ChangeEvent-Migration-Guide.md) for information about the new system.

## Overview

The Model Change Event system provided a centralized way for services to react to important data changes across the application. It replaced the previous approach of having each service directly subscribe to multiple observable data sources, which led to scattered and duplicated subscription logic.

## Key Components

### 1. ModelChangeEvent

A standardized event structure that includes:
- `type`: The type of model change (from `ModelChangeType` enum)
- `payload`: The data associated with the change
- `timestamp`: When the change occurred

### 2. ModelChangeType

An enum defining all the different types of model changes that services can emit or listen for, including:
- `USER_ASSESSMENT`
- `USER_PROFILE`
- `FTUX` (First Time User Experience)
- `AUTH`
- And many others...

### 3. ModelAwareService

A base service class that:
- Extends the standard `Service` class
- Subscribes to model change events
- Filters for the event types the service cares about
- Delegates handling to the `onModelChange` method

## How to Use

### Emitting Model Change Events

To notify the system that a model has changed:

```typescript
import { ModelChangeType, emitModelChange } from "@src/models/ModelChangeEvent";

// When a user completes an assessment
emitModelChange(ModelChangeType.USER_ASSESSMENT, assessmentData);

// When auth state changes
emitModelChange(ModelChangeType.AUTH, user);

// When FTUX progress changes
emitModelChange(ModelChangeType.FTUX, { step: 'completed_step', data: stepData });
```

### Consuming Model Change Events

1. Extend `ModelAwareService` instead of `Service`:

```typescript
import { ModelAwareService } from "./ModelAwareService";
import { ModelChangeType } from "@src/models/ModelChangeEvent";

@singleton()
export class MyService extends ModelAwareService {
  constructor() {
    // Specify which model change types this service cares about
    super('MyService', [
      ModelChangeType.USER_ASSESSMENT,
      ModelChangeType.FTUX
    ]);
  }
}
```

2. Implement the `onModelChange` method:

```typescript
protected async onModelChange(event: ModelChangeEvent): Promise<void> {
  switch (event.type) {
    case ModelChangeType.USER_ASSESSMENT:
      // Handle assessment changes
      await this.processAssessmentUpdate(event.payload);
      break;
    
    case ModelChangeType.FTUX:
      // Handle FTUX changes
      await this.handleFtuxChange(event.payload);
      break;
  }
}
```

3. Implement custom subscriptions if needed:

```typescript
protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
  // Subscribe to legacy observables if needed
  this.onChange(someObservable$, async (change) => {
    // Handle change...
  });
  
  return ok(true);
}
```

## Benefits

- **Centralized Event Handling**: All model changes flow through a single system
- **Type-Safe Event System**: ModelChangeType ensures correct event typing
- **Reduced Duplication**: Services only implement handling for events they care about
- **Improved Testability**: Easier to mock and test event handling
- **Better Organization**: Clear separation between event producers and consumers

## Migrating Existing Services

1. Change your service to extend `ModelAwareService` instead of `Service`
2. Specify the model change types your service is interested in
3. Move subscription logic from `initializeSubscriptions()` to `initializeCustomSubscriptions()`
4. Implement `onModelChange()` to handle model change events
5. Update methods that modify models to emit appropriate events

## Best Practices

- Emit model change events at the source of the change
- Keep payloads focused on the essential data needed by consumers
- When a service processes a model change event and produces derived data, it should emit a new model change event
- Services should only listen for events they actually need to process 