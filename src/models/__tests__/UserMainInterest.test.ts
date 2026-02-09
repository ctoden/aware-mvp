import { userMainInterests$, UserMainInterest, getUserMainInterestsArray, upsertUserMainInterest } from '../UserMainInterest';

describe('UserMainInterest Model', () => {
    const mockInterest: UserMainInterest = {
        id: 'test-id-1',
        user_id: 'user-1',
        interest: 'Technology',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    beforeEach(() => {
        // Clear the observable state before each test
        userMainInterests$.set(null);
    });

    describe('Observable State Management', () => {
        it('should initialize with null state', () => {
            expect(userMainInterests$.peek()).toBeNull();
        });

        it('should update state when interest is set', () => {
            upsertUserMainInterest(mockInterest);
            expect(userMainInterests$.peek()).toHaveProperty(mockInterest.id);
            expect(userMainInterests$.peek()?.[mockInterest.id]).toEqual(mockInterest);
        });

        it('should clear state when set to null', () => {
            upsertUserMainInterest(mockInterest);
            userMainInterests$.set(null);
            expect(userMainInterests$.peek()).toBeNull();
        });
    });

    describe('getUserMainInterestsArray', () => {
        it('should return empty array when no interests exist', () => {
            expect(getUserMainInterestsArray()).toEqual([]);
        });

        it('should return array of all interests', () => {
            const mockInterest2: UserMainInterest = {
                ...mockInterest,
                id: 'test-id-2',
                interest: 'Science'
            };

            upsertUserMainInterest(mockInterest);
            upsertUserMainInterest(mockInterest2);

            const interests = getUserMainInterestsArray();
            expect(interests).toHaveLength(2);
            expect(interests).toContainEqual(mockInterest);
            expect(interests).toContainEqual(mockInterest2);
        });
    });

    describe('upsertUserMainInterest', () => {
        it('should add new interest', () => {
            upsertUserMainInterest(mockInterest);
            expect(userMainInterests$.peek()?.[mockInterest.id]).toEqual(mockInterest);
        });

        it('should update existing interest', () => {
            upsertUserMainInterest(mockInterest);
            const updatedInterest = {
                ...mockInterest,
                interest: 'Updated Interest'
            };
            upsertUserMainInterest(updatedInterest);
            expect(userMainInterests$.peek()?.[mockInterest.id]).toEqual(updatedInterest);
        });

        it('should preserve unmodified fields when updating', () => {
            upsertUserMainInterest(mockInterest);
            const partialUpdate = {
                ...mockInterest,
                interest: 'Updated Interest'
            };
            upsertUserMainInterest(partialUpdate);
            
            const updated = userMainInterests$.peek()?.[mockInterest.id];
            expect(updated).toBeDefined();
            if (updated) {
                expect(updated.interest).toBe('Updated Interest');
                expect(updated.user_id).toBe(mockInterest.user_id);
                expect(updated.created_at).toBe(mockInterest.created_at);
            }
        });
    });
}); 