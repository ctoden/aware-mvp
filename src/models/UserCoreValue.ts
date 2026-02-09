import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";

export enum CoreValueType {
    SYSTEM_GENERATED = 'SYSTEM_GENERATED',
    USER_DEFINED = 'USER_DEFINED'
}

export interface ICoreValue {
    title: string;
    description: string;
}

export interface UserCoreValue extends ICoreValue {
    id: string;
    user_id: string;
    value_type: CoreValueType;
    created_at: string;
    updated_at: string;
}

export interface UserCoreValues {
    [key: string]: UserCoreValue;
}

// Create the observable state
export const userCoreValues$ = observable<Nilable<UserCoreValues>>(null);

export const convertCoreValuesToArray = (values: UserCoreValues | null | undefined): UserCoreValue[] => {
    if(!values) return [];   
    return Object.values(values);
}

// Helper function to get core values as an array
export function getUserCoreValuesArray(): UserCoreValue[] {
    const values = userCoreValues$.peek();
    if (!values) return [];
    return Object.values(values);
}

// Helper function to get core values count
export function getCoreValuesCount(): number {
    return getUserCoreValuesArray().length;
}

// Helper function to find a core value by title
export function findCoreValueByTitle(title: string): UserCoreValue | undefined {
    const values = getUserCoreValuesArray();
    return values.find(value => value.title === title);
}

// Helper function to update or add a core value
export function upsertCoreValue(value: UserCoreValue): void {
    let values = userCoreValues$.peek() ?? {};
    values[value.id] = value;
    // Ensure we only keep the 3 most recent core values
    const allValues = Object.values(values);
    if (allValues.length > 3) {
        // Sort by created_at timestamp, most recent first
        const sortedValues = allValues.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        // Keep only the 3 most recent values
        const recentValues = sortedValues.slice(0, 3);
        // Convert back to record object
        values = recentValues.reduce((acc, val) => {
            acc[val.id] = val;
            return acc;
        }, {} as UserCoreValues);
    }
    userCoreValues$.set(values);
}

// Helper function to remove a core value
export function removeCoreValue(id: string): void {
    const values = userCoreValues$.peek();
    if (!values) return;
    
    const newValues = { ...values };
    delete newValues[id];
    userCoreValues$.set(newValues);
}

// Helper function to remove all core values
export function clearCoreValues(): void {
    userCoreValues$.set(null);
}
