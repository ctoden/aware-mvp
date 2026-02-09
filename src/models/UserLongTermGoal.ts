import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";

export interface UserLongTermGoal {
    id: string;
    user_id: string;
    goal: string;
    created_at: string;
    updated_at: string;
}

export interface UserLongTermGoals {
    [key: string]: UserLongTermGoal;
}

export const userLongTermGoals$ = observable<Nilable<UserLongTermGoals>>(null);

export function getUserLongTermGoalsArray(): UserLongTermGoal[] {
    const values = userLongTermGoals$.peek();
    if (!values) return [];
    return Object.values(values);
}

export function upsertUserLongTermGoal(value: UserLongTermGoal): void {
    const values = userLongTermGoals$.peek() ?? {};
    values[value.id] = value;
    userLongTermGoals$.set(values);
}

export function removeUserLongTermGoal(id: string): void {
    const values = userLongTermGoals$.peek();
    if (!values) return;
    const newValues = { ...values };
    delete newValues[id];
    userLongTermGoals$.set(newValues);
}

export function clearUserLongTermGoals(): void {
    userLongTermGoals$.set(null);
} 