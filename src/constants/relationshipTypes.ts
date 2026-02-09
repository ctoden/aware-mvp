export const RELATIONSHIP_TYPES = [
    'Spouse',
    'Child',
    'Parent',
    'Sibling',
    'Friend',
    'Family',
    'Partner',
    'Colleague',
    'Other',
] as const;

export type RelationshipType = typeof RELATIONSHIP_TYPES[number];

export const relationshipOptions = RELATIONSHIP_TYPES.map(type => ({
    label: type,
    value: type,
}));