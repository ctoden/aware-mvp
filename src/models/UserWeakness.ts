import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";

export enum WeaknessType {
    SYSTEM_GENERATED = 'SYSTEM_GENERATED',
    USER_DEFINED = 'USER_DEFINED'
}

export interface IWeakness {
    title: string;
    description: string;
}

export interface UserWeakness extends IWeakness {
    id: string;
    user_id: string;
    weakness_type: WeaknessType;
    created_at: string;
    updated_at: string;
}

export interface UserWeaknesses {
    [key: string]: UserWeakness;
}

// Create the observable state
export const userWeaknesses$ = observable<Nilable<UserWeaknesses>>(null);

// Helper functions to interact with the data
export function getUserWeaknessesArray(): UserWeakness[] {
    const values = userWeaknesses$.peek();
    if (!values) return [];
    return Object.values(values);
}

// Helper function to get weaknesses count
export function getWeaknessesCount(): number {
    return getUserWeaknessesArray().length;
}

// Helper function to find a weakness by title
export function findWeaknessByTitle(title: string): UserWeakness | undefined {
    const values = getUserWeaknessesArray();
    return values.find(value => value.title === title);
}

// Helper function to update or add a weakness
export function upsertWeakness(value: UserWeakness): void {
    const values = userWeaknesses$.peek() ?? {};
    values[value.id] = value;
    userWeaknesses$.set(values);
}

// Helper function to remove a weakness
export function removeWeakness(id: string): void {
    const values = userWeaknesses$.peek();
    if (!values) return;
    
    const newValues = { ...values };
    delete newValues[id];
    userWeaknesses$.set(newValues);
}

// Helper function to remove all weaknesses
export function clearWeaknesses(): void {
    userWeaknesses$.set(null);
} 