
# Aware Project Feature Implementation Guide

This guide provides concise instructions and code samples to assist a Generative AI LLM in implementing a feature using the patterns and architecture found in the existing Aware project codebase.

## Table of Contents

1. [Database Layer](#database-layer)
2. [Models](#models)
3. [Business Logic (Actions and Services)](#business-logic-actions-and-services)
4. [Presentation Layer (Components)](#presentation-layer-components)
5. [Testing](#testing)

## Database Layer

### Supabase Migration

Create a new migration file for your feature using the Supabase CLI:

```bash
supabase migration new create_feature_table
```

Edit the generated SQL file to define the table schema. For example:

```sql
create type feature_type as enum ('TYPE_1', 'TYPE_2');

create table if not exists feature_table (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    description text not null,
    value_type feature_type not null default 'TYPE_1',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint feature_table_limit unique (user_id, title)
);

alter publication supabase_realtime add table feature_table;
alter table feature_table enable row level security;

create policy "Users can view their own features"
    on feature_table for select
    using (auth.uid() = user_id);

create policy "System can insert features"
    on feature_table for insert
    with check (auth.uid() = user_id);

create policy "System can update features"
    on feature_table for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete their features"
    on feature_table for delete
    using (auth.uid() = user_id);

create index idx_feature_table_user_id on feature_table(user_id);

create trigger set_updated_at_timestamp
    before update on feature_table
    for each row
    execute function update_updated_at_timestamp();
```

Apply the migration locally:

```bash
supabase migration up --local
```

## Models

Create a model file for your feature (e.g., `FeatureModel.ts`) that defines the data structure and observable state:

```typescript
import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";

export enum FeatureType {
    TYPE_1 = 'TYPE_1',
    TYPE_2 = 'TYPE_2'
}

export interface FeatureModel {
    id: string;
    user_id: string;
    title: string;
    description: string;
    value_type: FeatureType;
    created_at: string;
    updated_at: string;
}

export interface FeatureModels {
    [key: string]: FeatureModel;
}

export const featureModels$ = observable<Nilable<FeatureModels>>(null);

export function getFeatureModelsArray(): FeatureModel[] {
    const values = featureModels$.peek();
    if (!values) return [];
    return Object.values(values);
}

export function upsertFeatureModel(value: FeatureModel): void {
    const values = featureModels$.peek() ?? {};
    values[value.id] = value;
    featureModels$.set(values);
}

export function removeFeatureModel(id: string): void {
    const values = featureModels$.peek();
    if (!values) return;
    const newValues = { ...values };
    delete newValues[id];
    featureModels$.set(newValues);
}

export function clearFeatureModels(): void {
    featureModels$.set(null);
}
```

## Business Logic (Actions and Services)

### Actions

Actions encapsulate business logic and operations that can be executed. Create action files for your feature (e.g., `CreateFeatureAction.ts`).

#### CreateFeatureAction.ts

```typescript
import { err, ok, Result } from "neverthrow";
import { Action } from "../Action";
import { ILlmProvider, LlmMessage, LlmModelConfig } from "@src/providers/llm/LlmProvider";
import { generateFeaturePrompt } from "@src/prompts/FeaturePrompts";

export class CreateFeatureAction implements Action<FeatureModel[]> {
    name = "CreateFeatureAction";
    description = "Generate features using LLM based on provided context";

    constructor(private llmProvider: ILlmProvider) {}

    async execute<T = FeatureModel[]>(context: string, config?: LlmModelConfig): Promise<Result<T, Error>> {
        const featurePrompt = generateFeaturePrompt();
        const messages: LlmMessage[] = [featurePrompt, { role: 'user', content: context }];

        const result = await this.llmProvider.chat(messages, config);
        if (result.isErr()) {
            return err(result.error);
        }

        try {
            const parsedValues = JSON.parse(result.value) as FeatureModel[];
            return ok(parsedValues as unknown as T);
        } catch (error) {
            return err(new Error('Failed to parse feature response'));
        }
    }
}
```

### Services

Services handle data operations and business logic. Create service files for your feature (e.g., `FeatureService.ts`).

#### FeatureService.ts

```typescript
import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { Service } from "./Service";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { DataService } from "./DataService";
import { FeatureModel, FeatureType, featureModels$, upsertFeatureModel, removeFeatureModel, clearFeatureModels } from "@src/models/FeatureModel";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "@src/utils/UUIDUtil";

@singleton()
export class FeatureService extends Service {
    private readonly _dataService!: DataService;

    constructor() {
        super('FeatureService');
        this._dataService = this.addDependency(DataService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return ok(true);
        }
        const fetchResult = await this.fetchFeatureModels(userId);
        if (fetchResult.isErr()) {
            return err(fetchResult.error);
        }
        return ok(fetchResult.isOk());
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        featureModels$.set(null);
        return ok(true);
    }

    async fetchFeatureModels(userId: string): Promise<Result<FeatureModel[], Error>> {
        const result = await this._dataService.fetchData<FeatureModel>('feature_table', {
            filter: [{ field: 'user_id', value: userId }]
        });
        if (result.isErr()) {
            return err(result.error);
        }
        const valuesMap = result.value.reduce((acc, value) => {
            acc[value.id] = value;
            return acc;
        }, {} as Record<string, FeatureModel>);
        featureModels$.set(valuesMap);
        return ok(result.value);
    }

    async createFeatureModel(value: FeatureModel, type: FeatureType = FeatureType.TYPE_1): Promise<Result<FeatureModel, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const newFeatureModel: FeatureModel = {
            id: generateUUID(),
            user_id: userId,
            title: value.title,
            description: value.description,
            value_type: type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const result = await this._dataService.upsertData<FeatureModel>('feature_table', [newFeatureModel]);
        if (result.isErr()) {
            return err(result.error);
        }
        upsertFeatureModel(newFeatureModel);
        return ok(newFeatureModel);
    }

    async updateFeatureModel(id: string, updates: Partial<FeatureModel>): Promise<Result<FeatureModel, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const currentValues = featureModels$.peek();
        const existingValue = currentValues?.[id];
        if (!existingValue) {
            return err(new Error('Feature not found'));
        }
        const updatedValue: FeatureModel = {
            ...existingValue,
            ...updates,
            updated_at: new Date().toISOString()
        };
        const result = await this._dataService.updateData<FeatureModel>('feature_table', updatedValue);
        if (result.isErr()) {
            return err(result.error);
        }
        upsertFeatureModel(updatedValue);
        return ok(updatedValue);
    }

    async deleteFeatureModel(id: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const result = await this._dataService.deleteData('feature_table', {
            filter: [
                { field: 'id', value: id },
                { field: 'user_id', value: userId }
            ]
        });
        if (result.isErr()) {
            return err(result.error);
        }
        removeFeatureModel(id);
        return ok(true);
    }

    async clearFeatureModels(): Promise<Result<boolean, Error>> {
        clearFeatureModels();
        return ok(true);
    }
}
```

## Presentation Layer (Components)

Create component files for your feature (e.g., `FeatureList.tsx`, `FeatureCard.tsx`).

#### FeatureList.tsx

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useObservable } from '@legendapp/state/react';
import { featureModels$ } from '@src/models/FeatureModel';
import { FeatureCard } from './FeatureCard';

export const FeatureList: React.FC = () => {
    const featureModels = useObservable(featureModels$);

    if (!featureModels) {
        return <Text>Loading...</Text>;
    }

    return (
        <View>
            {Object.values(featureModels).map(value => (
                <FeatureCard key={value.id} featureModel={value} />
            ))}
        </View>
    );
};
```

#### FeatureCard.tsx

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { FeatureModel } from '@src/models/FeatureModel';

interface FeatureCardProps {
    featureModel: FeatureModel;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ featureModel }) => {
    return (
        <View style={{ padding: 10, borderBottomWidth: 1, borderColor: '#ccc' }}>
            <Text style={{ fontWeight: 'bold' }}>{featureModel.title}</Text>
            <Text>{featureModel.description}</Text>
        </View>
    );
};
```

## Testing

Follow the [Test Provider Pattern](#test-provider-pattern) to create unit tests for your services and actions. Use real ViewModels and TestProviders for UI testing with `@testing-library/react`.

### Example Unit Test for FeatureService

```typescript
import { FeatureService } from '@src/services/FeatureService';
import { TestDataService } from '@src/services/__tests__/TestDataService';
import { FeatureModel, FeatureType } from '@src/models/FeatureModel';

describe('FeatureService', () => {
    let featureService: FeatureService;
    let testDataService: TestDataService;

    beforeEach(() => {
        testDataService = new TestDataService();
        featureService = new FeatureService();
        featureService.addDependency(testDataService);
    });

    it('should fetch feature models', async () => {
        const userId = '123';
        const mockFeatureModels: FeatureModel[] = [
            {
                id: '1',
                user_id: userId,
                title: 'Feature 1',
                description: 'Description 1',
                value_type: FeatureType.TYPE_1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        testDataService.setMockData('feature_table', mockFeatureModels);
        const result = await featureService.fetchFeatureModels(userId);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual(mockFeatureModels);
        }
    });

    it('should create a feature model', async () => {
        const userId = '123';
        const mockFeatureModel: FeatureModel = {
            id: '1',
            user_id: userId,
            title: 'Feature 1',
            description: 'Description 1',
            value_type: FeatureType.TYPE_1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        testDataService.setMockData('feature_table', [mockFeatureModel]);
        const result = await featureService.createFeatureModel({
            title: 'Feature 1',
            description: 'Description 1'
        });
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toEqual(mockFeatureModel);
        }
    });
});
```

### Example UI Test for FeatureList

```typescript
import { render, screen } from '@testing-library/react';
import { FeatureList } from '@src/components/feature/FeatureList';
import { featureModels$ } from '@src/models/FeatureModel';
import { FeatureType } from '@src/models/FeatureModel';

describe('FeatureList', () => {
    it('renders feature models', () => {
        const mockFeatureModels = {
            '1': {
                id: '1',
                user_id: '123',
                title: 'Feature 1',
                description: 'Description 1',
                value_type: FeatureType.TYPE_1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        };
        featureModels$.set(mockFeatureModels);
        render(<FeatureList />);
        expect(screen.getByText('Feature 1')).toBeInTheDocument();
        expect(screen.getByText('Description 1')).toBeInTheDocument();
    });
});
```