import { userAboutYou$, AboutYouSectionType, UserAboutYou, getUserAboutYouArray, getEntriesBySection, upsertAboutYouEntry, removeAboutYouEntry, clearAboutYouEntries } from '../UserAboutYou';

describe('UserAboutYou Model', () => {
    const mockEntry: UserAboutYou = {
        id: 'test-id-1',
        user_id: 'user-1',
        title: 'Communication Style',
        description: 'You have a direct and assertive communication style, preferring clear and concise exchanges.',
        section_type: AboutYouSectionType.SELF_AWARENESS,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    beforeEach(() => {
        // Clear the observable state before each test
        clearAboutYouEntries();
    });

    describe('Observable State Management', () => {
        it('should initialize with null state', () => {
            expect(userAboutYou$.peek()).toBeNull();
        });

        it('should update state when entry is set', () => {
            upsertAboutYouEntry(mockEntry);
            expect(userAboutYou$.peek()).toHaveProperty(mockEntry.id);
            expect(userAboutYou$.peek()?.[mockEntry.id]).toEqual(mockEntry);
        });

        it('should clear state when clearAboutYouEntries is called', () => {
            upsertAboutYouEntry(mockEntry);
            clearAboutYouEntries();
            expect(userAboutYou$.peek()).toBeNull();
        });
    });

    describe('getUserAboutYouArray', () => {
        it('should return empty array when no entries exist', () => {
            expect(getUserAboutYouArray()).toEqual([]);
        });

        it('should return array of all entries', () => {
            const mockEntry2: UserAboutYou = {
                ...mockEntry,
                id: 'test-id-2',
                title: 'Career Goals',
                description: 'You are focused on continuous learning and professional growth.',
                section_type: AboutYouSectionType.CAREER_DEVELOPMENT
            };

            upsertAboutYouEntry(mockEntry);
            upsertAboutYouEntry(mockEntry2);

            const entries = getUserAboutYouArray();
            expect(entries).toHaveLength(2);
            expect(entries).toContainEqual(mockEntry);
            expect(entries).toContainEqual(mockEntry2);
        });
    });

    describe('getEntriesBySection', () => {
        it('should return empty array when no entries exist for section', () => {
            expect(getEntriesBySection(AboutYouSectionType.RELATIONSHIPS)).toEqual([]);
        });

        it('should return only entries for specified section', () => {
            const mockEntry2: UserAboutYou = {
                ...mockEntry,
                id: 'test-id-2',
                title: 'Career Goals',
                section_type: AboutYouSectionType.CAREER_DEVELOPMENT
            };

            const mockEntry3: UserAboutYou = {
                ...mockEntry,
                id: 'test-id-3',
                title: 'Another Self Awareness Entry',
                section_type: AboutYouSectionType.SELF_AWARENESS
            };

            upsertAboutYouEntry(mockEntry);
            upsertAboutYouEntry(mockEntry2);
            upsertAboutYouEntry(mockEntry3);

            const selfAwarenessEntries = getEntriesBySection(AboutYouSectionType.SELF_AWARENESS);
            expect(selfAwarenessEntries).toHaveLength(2);
            expect(selfAwarenessEntries).toContainEqual(mockEntry);
            expect(selfAwarenessEntries).toContainEqual(mockEntry3);

            const careerEntries = getEntriesBySection(AboutYouSectionType.CAREER_DEVELOPMENT);
            expect(careerEntries).toHaveLength(1);
            expect(careerEntries).toContainEqual(mockEntry2);
        });
    });

    describe('upsertAboutYouEntry', () => {
        it('should add new entry', () => {
            upsertAboutYouEntry(mockEntry);
            expect(userAboutYou$.peek()?.[mockEntry.id]).toEqual(mockEntry);
        });

        it('should update existing entry', () => {
            upsertAboutYouEntry(mockEntry);
            const updatedEntry = {
                ...mockEntry,
                description: 'Updated description'
            };
            upsertAboutYouEntry(updatedEntry);
            expect(userAboutYou$.peek()?.[mockEntry.id]).toEqual(updatedEntry);
        });

        it('should preserve unmodified fields when updating', () => {
            upsertAboutYouEntry(mockEntry);
            const partialUpdate = {
                ...mockEntry,
                description: 'Updated description'
            };
            upsertAboutYouEntry(partialUpdate);
            
            const updated = userAboutYou$.peek()?.[mockEntry.id];
            expect(updated).toBeDefined();
            if (updated) {
                expect(updated.description).toBe('Updated description');
                expect(updated.title).toBe(mockEntry.title);
                expect(updated.section_type).toBe(mockEntry.section_type);
            }
        });
    });

    describe('removeAboutYouEntry', () => {
        it('should remove entry by id', () => {
            const mockEntry2 = { ...mockEntry, id: 'test-id-2', title: 'Career Goals' };
            upsertAboutYouEntry(mockEntry);
            upsertAboutYouEntry(mockEntry2);

            removeAboutYouEntry(mockEntry.id);
            
            expect(userAboutYou$.peek()?.[mockEntry.id]).toBeUndefined();
            expect(userAboutYou$.peek()?.[mockEntry2.id]).toEqual(mockEntry2);
        });

        it('should handle removing non-existent entry', () => {
            upsertAboutYouEntry(mockEntry);
            removeAboutYouEntry('non-existent-id');
            expect(userAboutYou$.peek()?.[mockEntry.id]).toEqual(mockEntry);
        });

        it('should handle removing from empty state', () => {
            removeAboutYouEntry('test-id');
            expect(userAboutYou$.peek()).toBeNull();
        });
    });
}); 