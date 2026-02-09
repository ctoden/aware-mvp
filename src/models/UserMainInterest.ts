import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";
import { cloneDeep } from "lodash";


export interface UserMainInterest {
    id: string;
    user_id: string;
    interest: string;
    created_at: string;
    updated_at: string;
}

export interface UserMainInterests {
    [key: string]: UserMainInterest;
}

export type UserMainInterestCreate = Omit<UserMainInterest, "id" | "created_at" | "updated_at">;

export type UserMainInterestUpdate = Partial<UserMainInterestCreate> & {
    id: string;
};

// Observable state for main interests
export const userMainInterests$ = observable<Nilable<UserMainInterests>>(null);

// Helper functions
export function getUserMainInterestsArray(): UserMainInterest[] {
    const values = userMainInterests$.get();
    if (!values) return [];
    return Object.values(values);
}

export function upsertUserMainInterest(value: UserMainInterest): void {
    const values = cloneDeep(userMainInterests$.peek() ?? {});
    values[value.id] = value;
    userMainInterests$.set(values);
}

export function removeUserMainInterest(id: string): void {
    const values = cloneDeep(userMainInterests$.peek() ?? {});
    if (!values) return;
    delete values[id];
    userMainInterests$.set(values);
}

export function clearUserMainInterests(): void {
    userMainInterests$.set(null);
} 