import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";
import { cloneDeep } from "lodash";

export enum AboutYouSectionType {
    SELF_AWARENESS = 'SELF_AWARENESS',
    RELATIONSHIPS = 'RELATIONSHIPS',
    CAREER_DEVELOPMENT = 'CAREER_DEVELOPMENT'
}

export interface UserAboutYou {
    id: string;
    user_id: string;
    title: string;
    description: string;
    section_type: AboutYouSectionType;
    created_at: string;
    updated_at: string;
}

export interface UserAboutYouMap {
    [key: string]: UserAboutYou;
}

// Create the observable state
export const userAboutYou$ = observable<Nilable<UserAboutYouMap>>(null);
export const selectedAboutYou$ = observable<Nilable<UserAboutYou>>(null);

// Helper function to get entries as an array
export function getUserAboutYouArray(): UserAboutYou[] {
    const entries = userAboutYou$.peek();
    if (!entries) return [];
    return Object.values(entries);
}

// Helper function to get entries by section type
export function getEntriesBySection(sectionType: AboutYouSectionType): UserAboutYou[] {
    const entries = userAboutYou$.get();
    if (!entries) return [];
    return Object.values(entries).filter(entry => entry.section_type === sectionType);
}

// Helper function to update or add an entry
export function upsertAboutYouEntry(entry: UserAboutYou): void {
    const entries = cloneDeep(userAboutYou$.peek() ?? {});
    entries[entry.id] = entry;
    userAboutYou$.set(entries);
}

// Helper function to remove an entry
export function removeAboutYouEntry(id: string): void {
    const entries = cloneDeep(userAboutYou$.peek());
    if (!entries) return;
    
    delete entries[id];
    userAboutYou$.set(entries);
}

// Helper function to remove all entries
export function clearAboutYouEntries(): void {
    userAboutYou$.set(null);
}

// Helper function to set selected about you entry
export function setSelectedAboutYou(entry: UserAboutYou | null): void {
    selectedAboutYou$.set(entry);
}

// Helper function to get selected about you entry
export function getSelectedAboutYou(): UserAboutYou | null {
    const entry = selectedAboutYou$.peek();
    return entry ?? null;
} 