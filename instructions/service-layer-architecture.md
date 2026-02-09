# Service Layer Architecture

## 1. Core Components

### 1.1 Service Base Class
All services must extend the `Service` base class which provides:
- Lifecycle management (initialize/end)
- Dependency management
- Observable state management
- Error handling with neverthrow

```typescript
@singleton()
export abstract class Service extends ObservableLifecycleManager {
    readonly name: string;
    
    protected constructor(name: string) {
        super();
        this.name = name;
    }
    
    protected abstract onInitialize?(config?: LifeCycleConfig): Promise<Result<boolean, Error>>;
    protected abstract onEnd?(config?: LifeCycleConfig): Promise<Result<boolean, Error>>;
}
```

### 1.2 Provider Pattern
Services should delegate external interactions to providers:
- Providers implement an interface contract
- Providers are injected via DependencyService
- Test providers implement the same interface for unit testing
- Providers handle third-party service interactions

```typescript
// Provider Interface
export interface IProvider {
    readonly hasBeenInitialized: boolean;
    initialize(): Promise<Result<boolean, Error>>;
    end(): Promise<Result<boolean, Error>>;
}

// Example Provider Implementation
@singleton()
export class ExampleProvider extends ObservableLifecycleManager implements IProvider {
    protected _client: ThirdPartyClient | null = null;
    name = 'ExampleProvider';
    
    protected async onInitialize?(): Promise<Result<boolean, Error>> {
        // Initialize third-party client
        return BR_TRUE;
    }
}

// Test Provider for Unit Testing
@singleton()
export class TestProvider extends ObservableLifecycleManager implements IProvider {
    private dataStore: Map<string, any> = new Map();
    name = 'TestProvider';
    
    // Test helper methods
    setTestData(key: string, data: any) {
        this.dataStore.set(key, data);
    }
}
```

## 2. Service Implementation Rules

### 2.1 Service Class Structure
```typescript
@singleton()
export class ExampleService extends Service {
    private readonly _provider: IProvider;
    
    constructor() {
        super('ExampleService');
        this._provider = this.addDependency(PROVIDER_KEY);
    }
    
    protected async onInitialize(): Promise<Result<boolean, Error>> {
        const provider = this.ensureProvider();
        if (provider.isErr()) return err(provider.error);
        
        // Initialize subscriptions, fetch initial data
        return ok(true);
    }
    
    private ensureProvider(): Result<IProvider, Error> {
        if (!this._provider) {
            return err(new Error('Provider not initialized'));
        }
        return ok(this._provider);
    }
}
```

### 2.2 Key Rules
1. Services MUST:
   - Be decorated with `@singleton()`
   - Extend `Service` base class
   - Implement `onInitialize` and `onEnd`
   - Use providers for external interactions
   - Be registered with `AppInitializationService`

2. Services SHOULD:
   - Add dependencies via `addDependency`
   - Use Commands for complex workflows (>20 lines)
   - Handle errors using neverthrow `Result` type
   - Use observables for state management

3. Services MUST NOT:
   - Implement interfaces (they should be concrete implementations)
   - Directly interact with third-party services
   - Have circular dependencies

## 3. Testing Pattern

### 3.1 Unit Test Structure
```typescript
describe('ExampleService', () => {
    let service: ExampleService;
    let testProvider: TestProvider;
    
    beforeEach(async () => {
        // Setup test provider
        testProvider = new TestProvider();
        await testProvider.initialize();
        DependencyService.registerValue(PROVIDER_KEY, testProvider);
        
        // Initialize service
        service = new ExampleService();
        await service.initialize();
    });
    
    afterEach(async () => {
        await service.end();
        await testProvider.end();
        testProvider.clearTestData();
    });
});
```

### 3.2 Testing Rules
1. MUST use TestProvider pattern instead of mocks
2. SHOULD test features, not code coverage
3. MAY include direct third-party tests for providers
4. MUST clean up state between tests
5. MUST test error conditions using provider error states
- do not use the @DependencyService.ts unregister method, instead use the @ObservableLifecycleManager.ts clearDependencies method.
- do not attempt to unregister services from the @DependencyService.ts, instead use the @ObservableLifecycleManager.ts clearDependencies method.
- do not do 'container.clear()' in the test, instead use the @ObservableLifecycleManager.ts clearDependencies method.
- Do not use container directly in anything, instead use the @DependencyService.ts methods.

## 4. Error Handling

### 4.1 Provider Errors
- Use `BR_ERR` from NeverThrowUtils for provider errors
- Test providers should support error simulation
- Services should handle provider errors gracefully

### 4.2 Service Errors
- Use neverthrow `Result` type for all async operations
- Propagate errors up the call stack when appropriate

## 5. Dependency Management

### 5.1 Registration
Services and providers must be registered with `AppInitializationService`:
```typescript
@singleton()
export class AppInitializationService extends Service {
    constructor() {
        super('AppInitializationService');
        
        // Register providers
        DependencyService.registerValue(PROVIDER_KEY, new Provider());
        
        // Register services
        this.addDependency(ExampleService);
    }
}
```

### 5.2 Lifecycle
- Services are initialized in dependency order
- Providers must be initialized before services
- Cleanup happens in reverse order
- Use `onEnd` to clean up resources and subscriptions

## 6. State Management

### 6.1 Observable State
- Use `@legendapp/state` for observable state
- Register observables with providers for persistence
- Clean up subscriptions in `onEnd`

### 6.2 Subscriptions
```typescript
protected async initializeSubscriptions(): Promise<Result<boolean, Error>> {
    this.onChange(observable$, async (change) => {
        // Handle state changes
    });
    return ok(true);
}
```

## 7. Action Pattern

### 7.1 When to Use Actions
- Complex workflows (>20 lines)
- Multiple provider interactions
- Data validation and transformation
- Business logic that may change

### 7.2 Action Structure
```typescript
export class ExampleAction extends Action<Output> {
    constructor(private provider: IProvider) {
        super();
    }
    
    async execute(): Promise<Result<Output, Error>> {
        // Complex workflow logic
        return ok(result);
    }
}
```

## 8. Example Implementation

See the following files for reference implementations:
- `src/services/AuthService.ts` - Service implementation
- `SupabaseAuthProvider.ts` - Provider implementation
- `TestAuthProvider.ts` - Test provider
- `AuthService.test.ts` - Unit tests
- `src/actions/coreValues/CreateCoreValuesAction.ts` - Action implementation
- `src/actions/__tests__/CreateCoreValuesAction.test.ts` - Action Unit tests