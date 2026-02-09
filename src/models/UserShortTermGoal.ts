import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";

export interface UserShortTermGoal {
    id: string;
    user_id: string;
    goal: string;
    created_at: string;
    updated_at: string;
}

export interface UserShortTermGoals {
    [key: string]: UserShortTermGoal;
}

export const userShortTermGoals$ = observable<Nilable<UserShortTermGoals>>(null);

export function getUserShortTermGoalsArray(): UserShortTermGoal[] {
    const values = userShortTermGoals$.peek();
    if (!values) return [];
    return Object.values(values);
}

export function upsertUserShortTermGoal(value: UserShortTermGoal): void {
    const values = userShortTermGoals$.peek() ?? {};
    values[value.id] = value;
    userShortTermGoals$.set(values);
}

export function removeUserShortTermGoal(id: string): void {
    const values = userShortTermGoals$.peek();
    if (!values) return;
    const newValues = { ...values };
    delete newValues[id];
    userShortTermGoals$.set(newValues);
}

export function clearUserShortTermGoals(): void {
    userShortTermGoals$.set(null);
} 