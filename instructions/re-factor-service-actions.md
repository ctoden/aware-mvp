# Implementation Pattern Summary: Service & Action Architecture

## Overall Architecture

The implementation follows a structured approach using the Provider → Service → ViewModel → View pattern with SOLID principles, focusing on:

1. **Service Interfaces** - Define contracts for domain operations
2. **Model-Aware Services** - Manage state and database operations
3. **Action Classes** - Encapsulate business logic operations
4. **Error Handling** - Using `neverthrow` Result types

## Service Interface Pattern

```typescript
// [ServiceName]ActionService.interface.ts
import { Result } from "neverthrow";
import { Model, ModelType } from "@src/models/[ModelName]";

// Use interfaces from model files instead of redefining
import { IBasicModel } from "@src/models/[ModelName]";

export interface [ServiceName]ActionService {
    clear[ModelNamePlural](): Promise<Result<boolean, Error>>;
    create[ModelName](value: IBasicModel, type?: ModelType): Promise<Result<Model, Error>>;
    create[ModelNamePlural](values: IBasicModel[], type?: ModelType): Promise<Result<Model[], Error>>;
    update[ModelName](id: string, updates: Partial<IBasicModel>): Promise<Result<Model, Error>>;
    delete[ModelName](id: string): Promise<Result<boolean, Error>>;
    fetchUser[ModelNamePlural](userId: string): Promise<Result<Model[], Error>>;
}
```

## Service Implementation Pattern

```typescript
// [ServiceName]Service.ts
export class [ServiceName]Service extends ModelAwareService implements I[ServiceName]Service, [ServiceName]ActionService {
    private readonly _dataService!: DataService;
    private readonly _generateDataService!: GenerateDataService;

    constructor() {
        super();
        this._dataService = DependencyService.resolve(DataService);
        this._generateDataService = DependencyService.resolve(GenerateDataService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        try {
            // Initialize event subscriptions
            await this.initializeCustomSubscriptions();

            // Register actions with GenerateDataService
            this._generateDataService.registerAction(new Fetch[ModelNamePlural]Action(this));
            this._generateDataService.registerAction(new Generate[ModelNamePlural]Action(this));
            this._generateDataService.registerAction(new [ModelNamePlural]OnUserAssessmentChangeAction(this));

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
    
    // Method implementations follow the same pattern:
    // 1. Input validation
    // 2. Service operation
    // 3. Model updates
    // 4. Result transformation
    // 5. Error handling
}
```

## Action Classes Pattern

Three primary action classes:

### 1. Fetch Action

```typescript
export class Fetch[ModelNamePlural]Action implements Action<boolean> {
    name = "Fetch[ModelNamePlural]Action";
    description = "Fetches user [modelNamePlural] when the user logs in";

    constructor(private [serviceInstanceName]: [ServiceName]ActionService) {}

    async execute<T = boolean>(session?: any): Promise<Result<T, Error>> {
        if (!session?.user?.id) {
            return err(new Error("No user ID found in session")) as Result<T, Error>;
        }

        const result = await this.[serviceInstanceName].fetchUser[ModelNamePlural](session.user.id);
        if (result.isErr()) {
            return err(result.error) as Result<T, Error>;
        }

        return ok(true) as Result<T, Error>;
    }
}
```

### 2. Generate Action

```typescript
export class Generate[ModelNamePlural]Action implements Action<boolean> {
    name = "Generate[ModelNamePlural]Action";
    description = "Generate [modelNamePlural] after FTUX completion";

    constructor(private [serviceInstanceName]: [ServiceName]ActionService) {}

    async execute<T = boolean>(): Promise<Result<T, Error>> {
        // Only generate if FTUX is completed
        if (!ftuxState$.peek().hasCompletedFTUX) {
            return ok(true) as Result<T, Error>;
        }

        // Check if we have assessments to use
        const assessments = userAssessments$.peek();
        if (!assessments || assessments.length === 0) {
            return ok(true) as Result<T, Error>;
        }

        try {
            // Clear existing items
            await this.[serviceInstanceName].clear[ModelNamePlural]();

            // Prepare context from assessments
            const assessmentContext = assessments.map(assessment => 
                `${assessment.assessment_type}: ${assessment.name}\nDescription: ${assessment.assessment_summary}`
            ).join("\n");

            // Generate via LLM
            const llmService = DependencyService.resolve(LlmService);
            const generationResult = await llmService.generate[ModelNamePlural](assessmentContext);
            
            if (generationResult.isErr()) {
                return err(generationResult.error) as Result<T, Error>;
            }

            // Create from generated results
            const items = generationResult.value;
            await this.[serviceInstanceName].create[ModelNamePlural](items);

            return ok(true) as Result<T, Error>;
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error))) as Result<T, Error>;
        }
    }
}
```

### 3. OnUserAssessmentChange Action

```typescript
export class [ModelNamePlural]OnUserAssessmentChangeAction extends AssessmentBasedAction<boolean> {
    name = "[ModelNamePlural]OnUserAssessmentChangeAction";
    description = "Update [modelNamePlural] based on user assessments";

    constructor(private [serviceInstanceName]: [ServiceName]ActionService) {
        super();
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        try {
            if (!assessments || assessments.length === 0) {
                return ok(true);
            }

            // Clear existing items
            await this.[serviceInstanceName].clear[ModelNamePlural]();

            // Prepare context from assessments
            const assessmentContext = assessments.map(assessment => 
                `${assessment.assessment_type}: ${assessment.name}\nDescription: ${assessment.assessment_summary}`
            ).join("\n");

            // Generate via LLM
            const llmService = DependencyService.resolve(LlmService);
            const generationResult = await llmService.generate[ModelNamePlural](assessmentContext);
            
            if (generationResult.isErr()) {
                return err(generationResult.error);
            }

            // Create the items in DB
            const items = generationResult.value;
            const createResult = await this.[serviceInstanceName].create[ModelNamePlural](items);
            
            if (createResult.isErr()) {
                return err(createResult.error);
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }
}
```

## Key Implementation Notes

1. **Domain Model Consistency**: Use existing model interfaces (like `IWeakness`) instead of creating duplicates with different names (like `CoreValue`).

2. **Error Handling**: All service methods return `Result<T, Error>` for consistent error handling.

3. **Model Updates**: Services should update observable state and persist changes to the database.

4. **Action Registration**: Actions need to be registered with the `GenerateDataService` during service initialization.

5. **Assessment-Based Logic**: When generating content based on assessments, extract common patterns into base classes like `AssessmentBasedAction`.

6. **DependencyService**: Use `DependencyService.resolve()` to get service instances rather than direct imports.

7. **FTUX Check**: Many generation actions should check if the first-time user experience is completed before execution.

8. **Model Change Events**: Publish model change events when updating models to keep the system in sync.

## Implementation Steps for New Services

1. Define model and interfaces in a Model file
2. Create the ActionService interface
3. Implement the Service class
4. Create the three action classes (Fetch, Generate, OnUserAssessmentChange)
5. Register actions during service initialization
6. Update DataService to support the required data operations
7. Update LlmService to support generation of the new model type
