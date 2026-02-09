import { professionalDevelopment$, ProfessionalDevelopment, getProfessionalDevelopment, setProfessionalDevelopment, updateProfessionalDevelopment, clearProfessionalDevelopment } from '../ProfessionalDevelopment';

describe('ProfessionalDevelopment Model', () => {
    const mockProfDev: ProfessionalDevelopment = {
        id: 'test-id-1',
        user_id: 'user-1',
        key_terms: ['Strategic', 'Innovative', 'Collaborative'],
        description: 'Test professional development description',
        leadership_style_title: 'Transformational Leader',
        leadership_style_description: 'Focuses on inspiring and motivating team members',
        goal_setting_style_title: 'SMART Goals',
        goal_setting_style_description: 'Emphasizes specific, measurable, achievable objectives',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    beforeEach(() => {
        // Clear the observable state before each test
        clearProfessionalDevelopment();
    });

    describe('Observable State Management', () => {
        it('should initialize with null state', () => {
            expect(professionalDevelopment$.peek()).toBeNull();
        });

        it('should update state when professional development is set', () => {
            setProfessionalDevelopment(mockProfDev);
            expect(professionalDevelopment$.peek()).toEqual(mockProfDev);
        });

        it('should clear state when clearProfessionalDevelopment is called', () => {
            setProfessionalDevelopment(mockProfDev);
            clearProfessionalDevelopment();
            expect(professionalDevelopment$.peek()).toBeNull();
        });
    });

    describe('getProfessionalDevelopment', () => {
        it('should return null when no professional development exists', () => {
            expect(getProfessionalDevelopment()).toBeNull();
        });

        it('should return professional development when it exists', () => {
            setProfessionalDevelopment(mockProfDev);
            expect(getProfessionalDevelopment()).toEqual(mockProfDev);
        });
    });

    describe('updateProfessionalDevelopment', () => {
        it('should not update when no professional development exists', () => {
            updateProfessionalDevelopment({ description: 'Updated description' });
            expect(professionalDevelopment$.peek()).toBeNull();
        });

        it('should update existing professional development', () => {
            setProfessionalDevelopment(mockProfDev);
            const updates = {
                description: 'Updated description',
                leadership_style_title: 'Democratic Leader'
            };
            updateProfessionalDevelopment(updates);
            
            const updated = professionalDevelopment$.peek();
            expect(updated).toBeTruthy();
            if (updated) {
                expect(updated.description).toBe(updates.description);
                expect(updated.leadership_style_title).toBe(updates.leadership_style_title);
                expect(updated.id).toBe(mockProfDev.id); // Original fields should remain
                expect(updated.updated_at).not.toBe(mockProfDev.updated_at); // updated_at should change
            }
        });

        it('should preserve unmodified fields when updating', () => {
            setProfessionalDevelopment(mockProfDev);
            updateProfessionalDevelopment({ description: 'Updated description' });
            
            const updated = professionalDevelopment$.peek();
            expect(updated).toBeTruthy();
            if (updated) {
                expect(updated.description).toBe('Updated description');
                expect(updated.leadership_style_title).toBe(mockProfDev.leadership_style_title);
                expect(updated.goal_setting_style_title).toBe(mockProfDev.goal_setting_style_title);
                expect(updated.key_terms).toEqual(mockProfDev.key_terms);
            }
        });
    });
}); 