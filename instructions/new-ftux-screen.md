# Creating a New FTUX Screen

This guide outlines the steps to create a new screen in the First Time User Experience (FTUX) flow, using the AddRelationships screen as an example.

## Step 1: Add Route to Navigation Model
First, add your new route to the FTUX_Routes enum in `src/models/NavigationModel.ts`:

```typescript
export enum FTUX_Routes {
    // ... existing routes ...
    AddRelationships = 'AddRelationships', // Add your new route here
    // ... other routes ...
}
```

## Step 2: Create the Data Model
Create a new model file in `src/models/` to handle the screen's data. Example (`src/models/RelationshipDetailsModel.ts`):

```typescript
import { observable } from "@legendapp/state";

export interface YourDataType {
    // Define your data structure
}

export const yourData$ = observable<YourDataType[]>([]);

// Add helper functions for data manipulation
export function addData(data: YourDataType): void {
    yourData$.set((prev) => [...prev, data]);
}

export function removeData(index: number): void {
    yourData$.set((prev) => prev.filter((_, i) => i !== index));
}
```

## Step 3: Create the ViewModel
Create a new ViewModel in `src/viewModels/` to handle business logic. Example (`src/viewModels/YourViewModel.ts`):

```typescript
import { observable } from "@legendapp/state";
import { YourDataType, addData, yourData$ } from "@src/models/YourModel";
import { ViewModel } from "./ViewModel";
import { injectable } from "tsyringe";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";

@injectable()
export class YourViewModel extends ViewModel {
    public readonly data$ = yourData$;
    public readonly currentInput$ = observable<string>('');
    
    public readonly isValid$ = observable(() => 
        // Define validation logic
        this.currentInput$.get().trim().length > 0
    );

    constructor() {
        super('YourViewModel');
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    public addItem(): void {
        // Implement add logic
        const newItem = this.currentInput$.get().trim();
        if (newItem) {
            addData({ value: newItem });
            this.currentInput$.set('');
        }
    }
}

// Create singleton instance
export const yourViewModel = new YourViewModel();
```

Key points about ViewModels:
1. Must extend the base `ViewModel` class
2. Use `@injectable()` decorator for dependency injection
3. Pass name to base class in constructor
4. Implement lifecycle methods (`onInitialize` and `onEnd`)
5. Use LegendApp/state for reactive state management
6. Keep business logic separate from UI
7. Return `Result` types for error handling

## Step 4: Create UI Components
Create your screen components in `src/components/yourFeature/`. Split into smaller components if needed:

1. Main Screen Component (`YourScreen.tsx`):
```typescript
import React, { FC, useCallback } from 'react';
import { router } from 'expo-router';
import { Colors, Text, View } from 'react-native-ui-lib';
import { FTUX_Routes } from '@src/models/NavigationModel';

export const YourScreen: FC = () => {
    const handleContinue = useCallback(() => {
        router.push(`/${FTUX_Routes.NextScreen}`);
    }, []);

    return (
        <View flex padding-page style={{ backgroundColor: Colors.backgroundLight }}>
            {/* Your UI components */}
        </View>
    );
};
```

2. Sub-components (if needed):
```typescript
interface SubComponentProps {
    // Define props
}

export const SubComponent: FC<SubComponentProps> = ({ /* props */ }) => {
    return (
        <View>
            {/* Sub-component UI */}
        </View>
    );
};
```

## Step 5: Add Route File
Create a new route file in the `app` directory (`app/YourScreen.tsx`):

```typescript
import React from 'react';
import {View} from 'react-native-ui-lib';
import themeObject from '@app/constants/theme';
import {YourScreen} from "@src/components/yourFeature/YourScreen";

export default function YourScreen() {
  return (
    <View flex style={{ backgroundColor: themeObject.colorScheme.light.background }}>
      <YourScreen />
    </View>
  );
}
```

## Step 6: Add Stack Screen Entry
Add your screen to the Stack.Screen entries in `app/index.tsx`:

```typescript
<Stack screenOptions={{headerShown: false}}>
    {/* ... existing screens ... */}
    <Stack.Screen name="YourScreen" options={{headerShown: false}}/>
</Stack>
```

## Step 7: Update Navigation in Previous Screen
Update the navigation in the previous screen to point to your new screen:

```typescript
const handleContinue = useCallback(() => {
    router.push(`/${FTUX_Routes.YourScreen}`);
}, []);
```

## Best Practices
1. Follow SOLID principles and MVVM architecture
2. Keep models, views, and view models in separate layers
3. Use LegendApp/state for reactive state management
4. Use declarative styling from react-native-ui-lib
5. Implement proper type safety throughout
6. Keep components focused and single-responsibility
7. Reuse existing UI patterns and components when possible

## Common UI Patterns
- Header with Cancel/Done buttons
- Progress indicator (X/Y)
- Main content area
- Bottom navigation (Continue/Skip)
- Use theme colors and spacing from `@app/constants/theme`
- Follow existing component patterns for consistency

## Testing
Remember to add appropriate unit tests for:
- Models
- ViewModels
- Business Logic
- Navigation Flow

Follow the testing guidelines in `instructions/unit-test.md` for detailed testing requirements. 