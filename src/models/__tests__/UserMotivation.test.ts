import { userMotivations$, UserMotivation, getUserMotivationsArray, upsertMotivation, MotivationType } from '../UserMotivation';

describe('UserMotivation Model', () => {
    const mockMotivation: UserMotivation = {
        id: 'test-id-1',
        user_id: 'user-1',
        title: 'Personal Growth',
        description: 'Driven by continuous self-improvement and learning',
        motivation_type: MotivationType.SYSTEM_GENERATED,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    beforeEach(() => {
        // Clear the observable state before each test
        userMotivations$.set(null);
    });

    describe('Observable State Management', () => {
        it('should initialize with null state', () => {
            expect(userMotivations$.peek()).toBeNull();
        });

        it('should update state when motivation is set', () => {
            upsertMotivation(mockMotivation);
            expect(userMotivations$.peek()).toHaveProperty(mockMotivation.id);
            expect(userMotivations$.peek()?.[mockMotivation.id]).toEqual(mockMotivation);
        });

        it('should clear state when set to null', () => {
            upsertMotivation(mockMotivation);
            userMotivations$.set(null);
            expect(userMotivations$.peek()).toBeNull();
        });
    });

    describe('getUserMotivationsArray', () => {
        it('should return empty array when no motivations exist', () => {
            expect(getUserMotivationsArray()).toEqual([]);
        });

        it('should return array of all motivations', () => {
            const mockMotivation2: UserMotivation = {
                ...mockMotivation,
                id: 'test-id-2',
                title: 'Achievement',
                description: 'Motivated by accomplishing goals and reaching milestones',
                motivation_type: MotivationType.SYSTEM_GENERATED
            };

            upsertMotivation(mockMotivation);
            upsertMotivation(mockMotivation2);

            const motivations = getUserMotivationsArray();
            expect(motivations).toHaveLength(2);
            expect(motivations).toContainEqual(mockMotivation);
            expect(motivations).toContainEqual(mockMotivation2);
        });
    });

    describe('upsertMotivation', () => {
        it('should add new motivation', () => {
            upsertMotivation(mockMotivation);
            expect(userMotivations$.peek()?.[mockMotivation.id]).toEqual(mockMotivation);
        });

        it('should update existing motivation', () => {
            upsertMotivation(mockMotivation);
            const updatedMotivation = {
                ...mockMotivation,
                description: 'Updated description',
                title: 'Updated Title'
            };
            upsertMotivation(updatedMotivation);
            expect(userMotivations$.peek()?.[mockMotivation.id]).toEqual(updatedMotivation);
        });

        it('should preserve unmodified fields when updating', () => {
            upsertMotivation(mockMotivation);
            const partialUpdate = {
                ...mockMotivation,
                description: 'Updated description'
            };
            upsertMotivation(partialUpdate);
            
            const updated = userMotivations$.peek()?.[mockMotivation.id];
            expect(updated).toBeDefined();
            if (updated) {
                expect(updated.description).toBe('Updated description');
                expect(updated.title).toBe(mockMotivation.title);
                expect(updated.motivation_type).toBe(mockMotivation.motivation_type);
                expect(updated.created_at).toBe(mockMotivation.created_at);
            }
        });
    });
}); 