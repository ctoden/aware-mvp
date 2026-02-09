// conventional commit: feat: add user relationship model
import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";

/**
 * Represents a single relationship record for a user.
 */
export interface UserRelationship {
    id: string;
    user_id: string;
    key_terms: string[];  // 5 key terms
    description: string;
    communication_style_title: string;
    communication_style_description: string;
    conflict_style_title: string;
    conflict_style_description: string;
    attachment_style_title: string;
    attachment_style_description: string;
    created_at: string;
    updated_at: string;
}

/**
 * Used to store multiple relationships keyed by ID. 
 */
export interface UserRelationships {
    [key: string]: UserRelationship;
}

// Create an observable to track all of a user's relationships
export const userRelationships$ = observable<Nilable<UserRelationships>>(null);

/**
 * Returns an array of user relationships from the observable store.
 */
export function getUserRelationshipsArray(): UserRelationship[] {
    const relationships = userRelationships$.peek();
    return relationships ? Object.values(relationships) : [];
}

/**
 * Add or update a relationship in the observable store.
 */
export function upsertUserRelationship(relationship: UserRelationship): void {
    const relationships = userRelationships$.peek() ?? {};
    relationships[relationship.id] = relationship;
    userRelationships$.set(relationships);
}

/**
 * Remove a relationship by ID from the observable store.
 */
export function removeUserRelationship(id: string): void {
    const relationships = userRelationships$.peek();
    if (!relationships) return;
    const newRelationships = { ...relationships };
    delete newRelationships[id];
    userRelationships$.set(newRelationships);
}

/**
 * Clear all relationships from the observable store.
 */
export function clearUserRelationships(): void {
    userRelationships$.set(null);
} 