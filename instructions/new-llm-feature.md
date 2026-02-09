# Feature Development Guide

This guide shows how new features should be implemented in this codebase, following the existing patterns and architecture. Each layer of the system is addressed below, highlighting best practices in database migrations, data models, actions, services, prompts, and components. Code examples are provided to illustrate how each layer fits together.

---

## 1. Database Migrations

Database migrations are stored in Supabase under the "migrations" folder. Each migration is created by running:
  
```bash
supabase migration new <migration_name>
```

Below is a simplified version of the user_core_values migration. It shows how to create tables, enums, indexes, triggers, and policies for row-level security:

```sql:supabase/migrations/20240107000000_create_user_core_values.sql
-- Create enum for core value types
create type core_value_type as enum ('SYSTEM_GENERATED', 'USER_DEFINED');

-- Create the user_core_values table
create table if not exists user_core_values (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    value_type core_value_type not null default 'SYSTEM_GENERATED',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint user_core_values_limit unique (user_id, title)
);

-- Enable realtime
alter publication supabase_realtime add table user_core_values;

-- Row Level Security policies
alter table user_core_values enable row level security;

create policy "Users can view their own core values"
    on user_core_values for select
    using (auth.uid() = user_id);

create policy "System can insert core values"
    on user_core_values for insert
    with check (auth.uid() = user_id);

create policy "System can update core values"
    on user_core_values for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their core values"
    on user_core_values for delete
    using (auth.uid() = user_id);

-- Trigger to automatically update updated_at
create or replace function update_updated_at_timestamp()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

create trigger set_updated_at_timestamp
    before update on user_core_values
    for each row
    execute function update_updated_at_timestamp();

```

Migrations can be applied locally or against a remote database:
```bash
supabase migration up --local
```
or
```bash
supabase migration up --linked
```

---

## 2. Data Models

Dumb models contain only properties and simple helper functions. They should not contain business logic. Observables from "@legendapp/state" are used to maintain reactive data.

Below is an example "UserCoreValue" model with a local observable state and helper functions:

```typescript:src/models/UserCoreValue.ts
import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";

export enum CoreValueType {
    SYSTEM_GENERATED = 'SYSTEM_GENERATED',
    USER_DEFINED = 'USER_DEFINED'
}

export interface UserCoreValue {
    id: string;
    user_id: string;
    title: string;
    description: string;
    value_type: CoreValueType;
    created_at: string;
    updated_at: string;
}

export interface UserCoreValues {
    [key: string]: UserCoreValue;
}

// Create the observable state
export const userCoreValues$ = observable<Nilable<UserCoreValues>>(null);

// Helper functions to interact with the data
export function getUserCoreValuesArray(): UserCoreValue[] {
    const values = userCoreValues$.peek();
    if (!values) return [];
    return Object.values(values);
}

export function upsertCoreValue(value: UserCoreValue): void {
    const values = userCoreValues$.peek() ?? {};
    values[value.id] = value;
    userCoreValues$.set(values);
}

export function removeCoreValue(id: string): void {
    ...
}
```

---

## 3. Actions

Actions typically live in the "actions" folder. They encapsulate standalone logic that may call out to LLM providers or coordinate other business logic.

Here are examples showing how to:
1. Generate core values with an LLM.
2. Respond to user assessment changes by clearing and re-creating core values.
3. Await changes in an observable state.

### 3.1 CreateCoreValuesAction

This action uses an LLM provider to generate user core values in JSON format:

```typescript:src/actions/coreValues/CreateCoreValuesAction.ts
import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { CoreValue, ILlmProvider, LlmMessage, LlmModelConfig } from "@src/providers/llm/LlmProvider";
import { generateCoreValuesPrompt, retryCoreValuesPrompt, coreValuesUserContextPrompt } from "@src/prompts/CoreValues";

export class CreateCoreValuesAction implements Action<CoreValue[]> {
    name = "CreateCoreValuesAction";
    description = "Generate core values using LLM based on provided context";

    constructor(private llmProvider: ILlmProvider) {}

    async execute<T = CoreValue[]>(context: string, config?: LlmModelConfig): Promise<Result<T, Error>> {
        // call llmProvider.chat, parse JSON, validate
        // return ok(parsedValues) or err(error) accordingly
    }
}
```

### 3.2 CoreValuesOnUserAssessmentChangeAction

Listens for changes in user assessments. It clears existing user core values, re-generates them via LLM, and updates the observable model:

```typescript:src/actions/coreValues/CoreValuesOnUserAssessmentChangeAction.ts
import { err, ok, Result } from "neverthrow";
import { AssessmentBasedAction } from "../AssessmentBasedAction";
import { ICoreValuesService } from "./CoreValuesOnUserAssessmentChangeAction";
import { LlmService } from "@src/services/LlmService";

export class CoreValuesOnUserAssessmentChangeAction extends AssessmentBasedAction<boolean> {
    constructor(private coreValuesService: ICoreValuesService) {
        super();
    }

    protected async processAssessments(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        // Generate new core values via LlmService
        // Clear local state
        // Insert newly generated values
        return ok(true);
    }
}
```

### 3.3 AwaitCoreValuesCreationAction

Used to wait until the user’s core values have been created:

```typescript:src/actions/coreValues/AwaitCoreValuesCreationAction.ts
import { userCoreValues$, getUserCoreValuesArray } from "@src/models/UserCoreValue";
import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";

export class AwaitCoreValuesCreationAction implements Action<boolean> {
    async execute<T = boolean>(): Promise<Result<T, Error>> {
        // Wait for userCoreValues$ to contain some data, or time out
    }
}
```

---

## 4. Services

Services extend a base "Service" class and implement business logic, typically orchestrating interactions between data, providers, and actions. Services also manage side effects like subscribing to changes. They are registered as singletons using "tsyringe" and "DependencyService".

### 4.1 CoreValuesService

The CoreValuesService orchestrates fetching, creating, and updating user core values:

```typescript:src/services/CoreValuesService.ts
import { singleton } from "tsyringe";
import { Service } from "./Service";
import { DataService } from "./DataService";
import { LlmService } from "./LlmService";
import { userCoreValues$, upsertCoreValue } from "@src/models/UserCoreValue";
import { CoreValue } from "@src/providers/llm/LlmProvider";
import { err, ok, Result } from "neverthrow";

@singleton()
export class CoreValuesService extends Service implements ICoreValuesService {
    constructor() {
        super('CoreValuesService');
        // Add dependencies
        this._dataService = this.addDependency(DataService);
        this.addDependency(LlmService);
    }

    // onInitialize invoked automatically by the framework
    // fetch existing user core values, attach subscriptions

    async createCoreValue(value: CoreValue): Promise<Result<UserCoreValue, Error>> {
        // Insert to supabase, upsert local observable
        upsertCoreValue(newValue);
        return ok(newValue);
    }

    ...
}
```

### 4.2 LlmService

The LlmService wraps a chosen LLM provider (e.g., Mistral or OpenAI) and exposes methods for conversation, streaming, or structured generation. It uses the same base Service patterns:

```typescript:src/services/LlmService.ts
import { singleton } from "tsyringe";
import { Service } from "./Service";
import { ILlmProvider } from "@src/providers/llm/LlmProvider";

@singleton()
export class LlmService extends Service {
    private _llmProvider: ILlmProvider | null = null;

    protected async onInitialize?(): Promise<Result<boolean, Error>> {
        // Resolve LLM provider from the dependency container
        // e.g. this._llmProvider = DependencyService.resolveSafe(LLM_PROVIDER_KEY);
        // return error if none is found
    }

    async generateCoreValues(context: string, config?: LlmModelConfig) {
        // Instantiates CreateCoreValuesAction and executes it
    }
}
```

### 4.3 Example Tests

Unit tests use test providers rather than mocks. Here is a simplified snippet from “CoreValuesService.test.ts”:

```typescript:src/services/__tests__/CoreValuesService.test.ts
describe('CoreValuesService', () => {
    let coreValuesService: CoreValuesService;
    let testDataProvider: TestDataProvider;

    beforeEach(async () => {
        // Setup test data provider
        testDataProvider = new TestDataProvider();
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);

        // Initialize the service
        coreValuesService = new CoreValuesService();
        await coreValuesService.initialize();
    });

    it('should create a new core value', async () => {
        const newValue = { title: 'New Value', description: 'Desc' };
        const result = await coreValuesService.createCoreValue(newValue);
        expect(result.isOk()).toBe(true);
    });
});
```

---

## 5. Prompts

Prompts define how the system interacts with LLMs. They are stored in a dedicated folder and can use Mustache or other templating approaches to generate prompt text.

```typescript:src/prompts/CoreValues.ts
import Mustache from "mustache";
import { Prompt } from "@src/prompts/Prompt";

export const generateCoreValuesPrompt = (): Prompt => ({
    role: 'system',
    content: `Generate 3 core values for the user's profile...`
});

export const coreValuesUserContextPrompt = (context: string): Prompt => {
    const prompt = Mustache.render('User Profile and Assessment Context: {{ context }}', { context });
    return { role: 'system', content: prompt };
};

export const retryCoreValuesPrompt = (): Prompt => ({
    role: 'user',
    content: `The previous response was not in the correct format. Please reformat...`
});
```

---

## 6. Components

React (React Native Web / Expo) components should remain “dumb,” relying on view models and other state for logic. Components typically read from or subscribe to “@legendapp/state” observables and display data. Styling uses react-native-ui-lib with typed spacing and color props.

### 6.1 CoreValuesList

A simple list that reads core values from a Legend-State observable and renders them:

```typescript:src/components/coreValues/CoreValuesList.tsx
import { useObservable } from "@legendapp/state/react";
import { getUserCoreValuesArray } from "@src/models/UserCoreValue";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CoreValueCard } from "./CoreValueCard";

export const CoreValuesList: React.FC = () => {
    // Observes userCoreValues$ as an array
    const coreValues = useObservable(getUserCoreValuesArray());

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Core values</Text>
            {coreValues.map(value => (
                <CoreValueCard key={value.id} value={{
                    title: value.title,
                    description: value.description,
                    iconUrl: "https://cdn.builder.io/api/v1/image/..."
                }}/>
            ))}
        </View>
    );
};
```

### 6.2 CoreValueCard

Responsible for rendering a single core value:

```typescript:src/components/coreValues/CoreValueCard.tsx
import React from "react";
import { StyleSheet } from "react-native";
import { Image, Text, View } from "react-native-ui-lib";
import { CoreValueProps } from "./types";

interface CoreValueCardProps {
    value: CoreValueProps;
}

export const CoreValueCard: React.FC<CoreValueCardProps> = ({value}) => {
    return (
        <View flex padding-16 style={styles.qualityContainer}>
            <View row style={styles.headerContainer}>
                <Text style={styles.titleText}>{value.title}</Text>
                <Image source={{uri: value.iconUrl}} style={styles.icon} />
            </View>
            <Text style={styles.descriptionText}>{value.description}</Text>
        </View>
    );
};
```

### 6.3 Types

Optional interface for card props or other typed UI data:

```typescript:src/components/coreValues/types.ts
export interface CoreValueProps {
    title: string;
    description: string;
    iconUrl: string;
}
```

### 6.4 Example UI Test

Below is a simplified UI test using @testing-library/react-native:

```typescript:src/components/coreValues/__tests__/CoreValuesList.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { CoreValuesList } from '../CoreValuesList';
import { userCoreValues$ } from '@src/models/UserCoreValue';

describe('CoreValuesList', () => {
    beforeEach(() => {
        userCoreValues$.set({
            '1': {
                id: '1', user_id: 'test-user', title: 'Independence',
                description: 'Autonomy and freedom', value_type: 0,
                created_at: '', updated_at: ''
            }
        });
    });

    it('renders core values correctly', () => {
        const { getByText } = render(<CoreValuesList />);
        expect(getByText('Core values')).toBeTruthy();
        expect(getByText('Independence')).toBeTruthy();
        expect(getByText('Autonomy and freedom')).toBeTruthy();
    });
});
```

---

## Conclusion

Implementing new features should follow this layered approach. Each layer has clear ownership of responsibilities:
1. Migrations define the database schema.  
2. Models store and manage data in observables.  
3. Actions encapsulate standalone tasks or LLM-based logic.  
4. Services coordinate business logic and side effects.  
5. Prompts define how to talk to LLMs.  
6. Components read data and render the UI.  

Be sure to create unit tests for each layer. Use test providers to avoid mocking. Then wire everything together in a service or action, verifying it works end-to-end. This ensures consistency across the codebase following SOLID principles, MVVM architecture, and a well-structured approach to building and testing features.
