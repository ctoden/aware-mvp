# ChangeEvent Migration Guide

## Overview

This document outlines the migration from `ModelChangeEvent` to the more generic `ChangeEvent` system. The goal of this refactoring is to create a more versatile event system that focuses on application state changes rather than just model data changes.

## Why This Change?

The original `ModelChangeEvent` system was designed primarily for model data changes. However, our application has evolved to need a more general-purpose event system that can handle:

1. Application state changes (auth, FTUX, etc.)
2. UI-triggered events
3. System events

## Migration Timeline

This migration has been completed with the following phases:

1. **Phase 1**: Compatibility layer was put in place
2. **Phase 2**: Services updated to use new ChangeEvent
3. **Phase 3**: ViewModels updated to use new ChangeEvent
4. **Phase 4 (Completed)**: Compatibility layer removed

> **Note**: The migration is now complete. All references to `ModelChangeEvent` and `ModelChangeType` have been removed from the codebase.

## How to Migrate Your Code

### Step 1: Update Imports

Change your imports from:

```typescript
import { ModelChangeEvent, ModelChangeType, emitModelChange, modelChange$ } from "@src/models/ModelChangeEvent";
```

To:

```typescript
import { ChangeEvent, ChangeType, emitChange, change$ } from "@src/events/ChangeEvent";
```

### Step 2: Update Event Types

Replace `ModelChangeType` with `ChangeType`:

```typescript
// Before
const eventTypes = [ModelChangeType.AUTH, ModelChangeType.FTUX];

// After
const eventTypes = [ChangeType.AUTH, ChangeType.FTUX];
```

### Step 3: Update Event Emission

Replace `emitModelChange` with `emitChange`:

```typescript
// Before
emitModelChange(ModelChangeType.AUTH, userData);

// After
emitChange(ChangeType.AUTH, userData, 'user_action'); // Note the new source parameter
```

### Step 4: Update Event Handling

Update your event handlers to use `ChangeEvent` instead of `ModelChangeEvent`:

```typescript
// Before
protected async onModelChange(event: ModelChangeEvent): Promise<void> {
  if (event.type === ModelChangeType.AUTH) {
    // Handle auth event
  }
}

// After
protected async onStateChange(event: ChangeEvent): Promise<void> {
  if (event.type === ChangeType.AUTH) {
    // Handle auth event
    // You can now also check event.source if needed
  }
}
```

### Step 5: For Services Extending ModelAwareService

Change your service to extend `EventAwareService` instead:

```typescript
// Before
export class AuthService extends ModelAwareService {
  constructor() {
    super('AuthService', [ModelChangeType.AUTH, ModelChangeType.FTUX]);
  }
  
  protected async onModelChange(event: ModelChangeEvent): Promise<void> {
    // Handle event
  }
}

// After
export class AuthService extends EventAwareService {
  constructor() {
    super('AuthService', [ChangeType.AUTH, ChangeType.FTUX]);
  }
  
  protected async onStateChange(event: ChangeEvent): Promise<void> {
    // Handle event
  }
}
```

## New Features in ChangeEvent

The new `ChangeEvent` system includes several improvements:

1. **Event Source Tracking**: Events now include a `source` property that can be 'user_action', 'system', or 'api'
2. **Better Organization**: Event types are organized by category
3. **Improved Documentation**: Better JSDoc comments throughout the codebase

## Best Practices

1. **Use Specific Event Types**: Choose the most specific event type for your use case
2. **Set Appropriate Source**: Always set the source parameter when emitting events
3. **Minimize Event Emissions**: Only emit events when necessary to avoid performance issues
4. **Subscribe Only to Needed Events**: Services should only subscribe to events they actually need to handle

## Troubleshooting

If you encounter issues during migration:

1. Check that you've updated all imports
2. Verify that you're using the correct event types
3. Make sure your event handlers are updated to handle the new event structure
4. If using TypeScript, let the type system guide you to the correct usage

## Questions?

If you have questions about this migration, please contact the core development team.
