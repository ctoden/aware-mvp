## Goal

- Generate the UI layer for a new feature. This means impelment the View and ViewModel for the feature (with unit tests). 
- We should not create new services or models for the feature. 
- It is okay if the ViewModel has a stubbed implementation of the service and models that are placeholders for the actual implementation.

## UI Guidelines

- use reactive-native-ui-lib, ReactiveButton.tsx, ReactiveText.tsx and ReactiveTextField.tsx for UI
- Styles should come from the theme.ts file, as well as spacing, border radius, shadows, etc
- use the Colors.ts for colors
- use _layout.tsx for fonts
- prefer using declarative styling over StyleSheet.create

example of declarative styling:

```tsx
import React, { FC } from 'react';
import { View, Image } from 'react-native-ui-lib';
import { ReactiveButton } from '@src/components/ReactiveButton';
import { ReactiveText } from '@src/components/ReactiveText';
import { Ionicons } from '@expo/vector-icons';
import themeObject from '@app/constants/theme';

 <View padding-10 style={{ backgroundColor: colors.background, }}>
      <TouchableOpacity paddingL-20 onPress={() => { router.back() }} >
        <Ionicons name="return-up-back" size={24} color="black" />

      </TouchableOpacity>
    </View>
```
See how it uses: "padding-10" and "paddingL-20" to set the padding.

use observables and useObservable from legend-state-react.md

Business and functional logic should be implemented in a @ViewModel.ts; the ui (tsx) should be limited to styling and layout. 

ViewModels should utlize Models to work with data and Services to work with outside sevices like LLMs, Storage, and Databases.

Services should be singletons and should be injected into the ViewModel.

Models should be simple data structures that are easy to work with.

## MVVM Pattern Example

Below is a simplified example of the MVVM pattern to illustrate the basic structure and relationships. This is not meant to be a complete implementation, but rather a starting point to understand the pattern. For complete implementations and additional patterns, please refer to existing files in the codebase such as:
- `src/services/UserShortTermGoalService.ts`
- `src/viewModels/UserShortTermGoalViewModel.ts`
- `src/models/UserShortTermGoal.ts`
- Other similar feature implementations

The example below shows one way to implement the pattern, but your implementation may need additional methods, lifecycle hooks, and error handling depending on your specific requirements:

```typescript
// Model (src/models/ShortTermGoalModel.ts)
import { observable } from "@legendapp/state";

export interface ShortTermGoal {
  id: string;
  user_id: string;
  goal: string;
  created_at: string;
  updated_at: string;
}

export const shortTermGoals$ = observable<Record<string, ShortTermGoal>>({});

export const getShortTermGoalsArray = () => {
  return Object.values(shortTermGoals$.peek());
};

export const upsertShortTermGoal = (goal: ShortTermGoal) => {
  shortTermGoals$[goal.id].set(goal);
};

export const removeShortTermGoal = (id: string) => {
  delete shortTermGoals$.peek()[id];
  shortTermGoals$.set({ ...shortTermGoals$.peek() });
};

export const clearShortTermGoals = () => {
  shortTermGoals$.set({});
};

// Service (src/services/ShortTermGoalService.ts)
import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { Service } from "./Service";
import { DataService } from "./DataService";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "@src/utils/UUIDUtil";

@singleton()
export class ShortTermGoalService extends Service {
    private readonly _dataService!: DataService;

    constructor() {
        super('ShortTermGoalService');
        this._dataService = this.addDependency(DataService);
    }

    async createShortTermGoal(goal: string): Promise<Result<ShortTermGoal, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const newGoal: ShortTermGoal = {
            id: generateUUID(),
            user_id: userId,
            goal,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await this._dataService.upsertData<ShortTermGoal>('short_term_goals', [newGoal]);
        if (result.isErr()) {
            return err(result.error);
        }

        upsertShortTermGoal(newGoal);
        return ok(newGoal);
    }
}

// ViewModel (src/viewModels/ShortTermGoalViewModel.ts)
import { Result } from "neverthrow";
import { ViewModel } from "./ViewModel";
import { injectable } from "tsyringe";
import { ShortTermGoalService } from "@src/services/ShortTermGoalService";
import { getShortTermGoalsArray, ShortTermGoal } from "@src/models/ShortTermGoalModel";

@injectable()
export class ShortTermGoalViewModel extends ViewModel {
    private readonly _shortTermGoalService!: ShortTermGoalService;

    constructor() {
        super('ShortTermGoalViewModel');
        this._shortTermGoalService = this.addDependency(ShortTermGoalService);
    }

    getShortTermGoals(): ShortTermGoal[] {
        return getShortTermGoalsArray();
    }

    async addShortTermGoal(goal: string): Promise<Result<ShortTermGoal, Error>> {
        return await this._shortTermGoalService.createShortTermGoal(goal);
    }
}

// UI Component (using reactive components)
import React, { FC, useCallback } from 'react';
import { View } from 'react-native-ui-lib';
import { ReactiveButton } from '@src/components/ReactiveButton';
import { ReactiveTextField } from '@src/components/ReactiveTextField';
import { useViewModel } from '@src/hooks/useViewModel';
import { ShortTermGoalViewModel } from '@src/viewModels/ShortTermGoalViewModel';
import { observable } from '@legendapp/state';

export const ShortTermGoalInput: FC = () => {
    const { viewModel } = useViewModel(ShortTermGoalViewModel);
    const goal$ = observable("");

    const handleSubmit = useCallback(async () => {
        const result = await viewModel.addShortTermGoal(goal$.peek());
        if (result.isOk()) {
            goal$.set("");
        }
    }, [viewModel]);

    return (
        <View padding-page>
            <ReactiveTextField
                value$={goal$}
                placeholder="Enter your goal"
            />
            <ReactiveButton
                label="Add Goal"
                onPress={handleSubmit}
            />
        </View>
    );
};
```

This pattern provides a foundation for:
- Singleton services with dependency injection using tsyringe
- Observable state management with legendapp/state
- Error handling with neverthrow
- Clear separation of concerns between Model, Service, and ViewModel
- Reactive UI components that respond to state changes
- Services that extend base Service class for lifecycle management
- ViewModels that extend base ViewModel class for dependency management

Remember to:
- Review similar implementations in the codebase for additional patterns and best practices
- Consider adding appropriate lifecycle hooks (onInitialize, onEnd) as needed
- Implement proper error handling for your specific use case
- Add necessary data fetching and state management methods
- Include proper type definitions and validation
- Follow the established patterns for dependency injection and service management
- Search the codebase to determine the existing Service and Model implementations for your new feature. If they exist, use them. If they don't, DO NOTcreate new ones.