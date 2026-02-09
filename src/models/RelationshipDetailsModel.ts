import { observable } from "@legendapp/state";
import { RelationshipType } from '@src/constants/relationshipTypes';

export interface RelationshipDetails {
    relationshipType: RelationshipType;
    name: string;
}

export const relationshipDetails$ = observable<RelationshipDetails[]>([]);

export function addRelationshipDetails(details: RelationshipDetails): void {
    relationshipDetails$.set((prev) => [...prev, details]);
}

export function removeRelationshipDetails(index: number): void {
    relationshipDetails$.set((prev) => prev.filter((_, i) => i !== index));
}

export function clearRelationshipDetails(): void {
    relationshipDetails$.set([]);
} 