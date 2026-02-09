import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";

export enum MotivationType {
    SYSTEM_GENERATED = 'SYSTEM_GENERATED',
    USER_DEFINED = 'USER_DEFINED'
}

export interface IMotivation {
    title: string;
    description: string;
}

export interface UserMotivation extends IMotivation {
    id: string;
    user_id: string;
    motivation_type: MotivationType;
    created_at: string;
    updated_at: string;
}

export interface UserMotivations {
    [key: string]: UserMotivation;
}

// Create the observable state
export const userMotivations$ = observable<Nilable<UserMotivations>>(null);

// Helper functions to interact with the data
export function getUserMotivationsArray(motiviations: UserMotivations | null | undefined = null): UserMotivation[] {
    const values = motiviations ?? userMotivations$.peek();
    if (!values) return [];
    return Object.values(values);
}

// Helper function to get motivations count
export function getMotivationsCount(): number {
    return getUserMotivationsArray().length;
}

// Helper function to find a motivation by title
export function findMotivationByTitle(title: string): UserMotivation | undefined {
    const values = getUserMotivationsArray();
    return values.find(value => value.title === title);
}

// Helper function to update or add a motivation
export function upsertMotivation(value: UserMotivation): void {
    const values = userMotivations$.peek() ?? {};
    values[value.id] = value;
    userMotivations$.set(values);
}

// Helper function to remove a motivation
export function removeMotivation(id: string): void {
    const values = userMotivations$.peek();
    if (!values) return;
    
    const newValues = { ...values };
    delete newValues[id];
    userMotivations$.set(newValues);
}

// Helper function to remove all motivations
export function clearMotivations(): void {
    userMotivations$.set(null);
} 