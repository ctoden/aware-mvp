import { userRelationships$, UserRelationship, getUserRelationshipsArray, upsertUserRelationship } from '../UserRelationship';

describe('UserRelationship Model', () => {
    const mockRelationship: UserRelationship = {
        id: 'test-id-1',
        user_id: 'user-1',
        key_terms: ['Empathetic', 'Supportive', 'Collaborative', 'Respectful', 'Understanding'],
        description: 'Test relationship description',
        communication_style_title: 'Active Listener',
        communication_style_description: 'Focuses on understanding others through attentive listening',
        conflict_style_title: 'Collaborative Problem-Solver',
        conflict_style_description: 'Seeks win-win solutions through open dialogue',
        attachment_style_title: 'Secure',
        attachment_style_description: 'Forms stable and trusting bonds with others',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    beforeEach(() => {
        // Clear the observable state before each test
        userRelationships$.set(null);
    });

    describe('Observable State Management', () => {
        it('should initialize with null state', () => {
            expect(userRelationships$.peek()).toBeNull();
        });

        it('should update state when relationship is set', () => {
            upsertUserRelationship(mockRelationship);
            expect(userRelationships$.peek()).toHaveProperty(mockRelationship.id);
            expect(userRelationships$.peek()?.[mockRelationship.id]).toEqual(mockRelationship);
        });

        it('should clear state when set to null', () => {
            upsertUserRelationship(mockRelationship);
            userRelationships$.set(null);
            expect(userRelationships$.peek()).toBeNull();
        });
    });

    describe('getUserRelationshipsArray', () => {
        it('should return empty array when no relationships exist', () => {
            expect(getUserRelationshipsArray()).toEqual([]);
        });

        it('should return array of all relationships', () => {
            const mockRelationship2: UserRelationship = {
                ...mockRelationship,
                id: 'test-id-2',
                communication_style_title: 'Direct Communicator',
                communication_style_description: 'Clearly expresses thoughts and expectations',
                key_terms: ['Direct', 'Clear', 'Honest', 'Straightforward', 'Transparent']
            };

            upsertUserRelationship(mockRelationship);
            upsertUserRelationship(mockRelationship2);

            const relationships = getUserRelationshipsArray();
            expect(relationships).toHaveLength(2);
            expect(relationships).toContainEqual(mockRelationship);
            expect(relationships).toContainEqual(mockRelationship2);
        });
    });

    describe('upsertUserRelationship', () => {
        it('should add new relationship', () => {
            upsertUserRelationship(mockRelationship);
            expect(userRelationships$.peek()?.[mockRelationship.id]).toEqual(mockRelationship);
        });

        it('should update existing relationship', () => {
            upsertUserRelationship(mockRelationship);
            const updatedRelationship = {
                ...mockRelationship,
                description: 'Updated description',
                communication_style_title: 'Updated Style'
            };
            upsertUserRelationship(updatedRelationship);
            expect(userRelationships$.peek()?.[mockRelationship.id]).toEqual(updatedRelationship);
        });

        it('should preserve unmodified fields when updating', () => {
            upsertUserRelationship(mockRelationship);
            const partialUpdate = {
                ...mockRelationship,
                description: 'Updated description'
            };
            upsertUserRelationship(partialUpdate);
            
            const updated = userRelationships$.peek()?.[mockRelationship.id];
            expect(updated).toBeDefined();
            if (updated) {
                expect(updated.description).toBe('Updated description');
                expect(updated.communication_style_title).toBe(mockRelationship.communication_style_title);
                expect(updated.conflict_style_title).toBe(mockRelationship.conflict_style_title);
                expect(updated.key_terms).toEqual(mockRelationship.key_terms);
            }
        });

        it('should handle key_terms updates correctly', () => {
            upsertUserRelationship(mockRelationship);
            const updatedRelationship = {
                ...mockRelationship,
                key_terms: ['New', 'Updated', 'Terms', 'Array', 'Here']
            };
            upsertUserRelationship(updatedRelationship);
            
            const updated = userRelationships$.peek()?.[mockRelationship.id];
            expect(updated).toBeDefined();
            if (updated) {
                expect(updated.key_terms).toEqual(['New', 'Updated', 'Terms', 'Array', 'Here']);
                expect(updated.key_terms).toHaveLength(5);
            }
        });
    });
}); 