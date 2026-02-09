import { userWeaknesses$, WeaknessType, UserWeakness, getUserWeaknessesArray, getWeaknessesCount, findWeaknessByTitle, upsertWeakness, removeWeakness, clearWeaknesses } from '../UserWeakness';

describe('UserWeakness Model', () => {
    const mockWeakness: UserWeakness = {
        id: 'test-id-1',
        user_id: 'user-1',
        title: 'Time Management',
        description: 'You sometimes struggle to prioritize tasks effectively, though you\'re actively working on improving your organizational skills.',
        weakness_type: WeaknessType.SYSTEM_GENERATED,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    beforeEach(() => {
        // Clear the observable state before each test
        clearWeaknesses();
    });

    describe('Observable State Management', () => {
        it('should initialize with null state', () => {
            expect(userWeaknesses$.peek()).toBeNull();
        });

        it('should update state when weakness is set', () => {
            upsertWeakness(mockWeakness);
            expect(userWeaknesses$.peek()).toHaveProperty(mockWeakness.id);
            expect(userWeaknesses$.peek()?.[mockWeakness.id]).toEqual(mockWeakness);
        });

        it('should clear state when clearWeaknesses is called', () => {
            upsertWeakness(mockWeakness);
            clearWeaknesses();
            expect(userWeaknesses$.peek()).toBeNull();
        });
    });

    describe('getUserWeaknessesArray', () => {
        it('should return empty array when no weaknesses exist', () => {
            expect(getUserWeaknessesArray()).toEqual([]);
        });

        it('should return array of all weaknesses', () => {
            const mockWeakness2: UserWeakness = {
                ...mockWeakness,
                id: 'test-id-2',
                title: 'Public Speaking',
                description: 'You feel less confident when presenting to large groups, but your preparation and practice are steadily building your comfort level.'
            };

            upsertWeakness(mockWeakness);
            upsertWeakness(mockWeakness2);

            const weaknesses = getUserWeaknessesArray();
            expect(weaknesses).toHaveLength(2);
            expect(weaknesses).toContainEqual(mockWeakness);
            expect(weaknesses).toContainEqual(mockWeakness2);
        });
    });

    describe('getWeaknessesCount', () => {
        it('should return 0 when no weaknesses exist', () => {
            expect(getWeaknessesCount()).toBe(0);
        });

        it('should return correct count of weaknesses', () => {
            upsertWeakness(mockWeakness);
            expect(getWeaknessesCount()).toBe(1);

            const mockWeakness2: UserWeakness = {
                ...mockWeakness,
                id: 'test-id-2',
                title: 'Public Speaking'
            };
            upsertWeakness(mockWeakness2);
            expect(getWeaknessesCount()).toBe(2);
        });
    });

    describe('findWeaknessByTitle', () => {
        it('should return undefined when weakness not found', () => {
            expect(findWeaknessByTitle('NonExistent')).toBeUndefined();
        });

        it('should find weakness by title', () => {
            upsertWeakness(mockWeakness);
            const found = findWeaknessByTitle('Time Management');
            expect(found).toEqual(mockWeakness);
        });

        it('should return undefined when weaknesses list is empty', () => {
            expect(findWeaknessByTitle('Time Management')).toBeUndefined();
        });
    });

    describe('upsertWeakness', () => {
        it('should add new weakness', () => {
            upsertWeakness(mockWeakness);
            expect(userWeaknesses$.peek()?.[mockWeakness.id]).toEqual(mockWeakness);
        });

        it('should update existing weakness', () => {
            upsertWeakness(mockWeakness);
            const updatedWeakness = {
                ...mockWeakness,
                description: 'Updated description'
            };
            upsertWeakness(updatedWeakness);
            expect(userWeaknesses$.peek()?.[mockWeakness.id]).toEqual(updatedWeakness);
        });

        it('should preserve unmodified fields when updating', () => {
            upsertWeakness(mockWeakness);
            const partialUpdate = {
                ...mockWeakness,
                description: 'Updated description'
            };
            upsertWeakness(partialUpdate);
            
            const updated = userWeaknesses$.peek()?.[mockWeakness.id];
            expect(updated).toBeDefined();
            if (updated) {
                expect(updated.description).toBe('Updated description');
                expect(updated.title).toBe(mockWeakness.title);
                expect(updated.weakness_type).toBe(mockWeakness.weakness_type);
            }
        });
    });

    describe('removeWeakness', () => {
        it('should remove weakness by id', () => {
            const mockWeakness2 = { ...mockWeakness, id: 'test-id-2', title: 'Public Speaking' };
            upsertWeakness(mockWeakness);
            upsertWeakness(mockWeakness2);

            removeWeakness(mockWeakness.id);
            
            expect(userWeaknesses$.peek()?.[mockWeakness.id]).toBeUndefined();
            expect(userWeaknesses$.peek()?.[mockWeakness2.id]).toEqual(mockWeakness2);
        });

        it('should handle removing non-existent weakness', () => {
            upsertWeakness(mockWeakness);
            removeWeakness('non-existent-id');
            expect(userWeaknesses$.peek()?.[mockWeakness.id]).toEqual(mockWeakness);
        });

        it('should handle removing from empty state', () => {
            removeWeakness('test-id');
            expect(userWeaknesses$.peek()).toBeNull();
        });
    });
}); 