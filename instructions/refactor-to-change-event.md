# ChangeEvent System Refactoring Guidelines

## Overview
The Aware MVP project has completed a migration from the deprecated ModelChangeEvent system to the new ChangeEvent system. This memory contains key guidelines and best practices for working with the ChangeEvent system.

## Key Components
- **ChangeEvent**: Standardized event structure with type, payload, timestamp, and source
- **ChangeType**: Enum defining all state change types (replaces ModelChangeType)
- **EventAwareService**: Base service class for handling state changes (replaces ModelAwareService)
- **ChangeEventUtils**: Utility functions for event handling

## Migration Steps Completed
1. Updated imports from ModelChangeEvent to ChangeEvent
2. Replaced ModelChangeType with ChangeType
3. Updated services to extend EventAwareService instead of ModelAwareService
4. Implemented onStateChange instead of onModelChange
5. Updated event emission from emitModelChange to emitChange
6. Removed ModelChangeEvent.ts and ModelChangeUtils.ts files

## Best Practices
1. Be specific with event types - only subscribe to what's needed
2. Always specify the source of events ('user_action', 'system', 'api')
3. Use ChangeEventUtils for cleaner event handling
4. Keep handlers focused with single responsibilities
5. Avoid triggering additional events in handlers when possible
6. Always implement onStateChange when extending EventAwareService

## Documentation
- ChangeEvent-System.md: Comprehensive documentation of the new system
- change-event-system.mdc: Rules and guidelines for using the system
- ChangeEvent-Migration-Guide.md: Guide showing the completed migration
- model-change-events.md: Marked as deprecated with redirect to new docs