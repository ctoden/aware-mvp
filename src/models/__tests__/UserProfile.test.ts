import { UserProfile, getUserProfile, setUserProfile, updateUserProfile, clearUserProfile, userProfile$ } from '../UserProfile';

describe('UserProfile', () => {
    const mockProfile: UserProfile = {
        id: 'test-id',
        full_name: 'Test User',
        avatar_url: null,
        website: null,
        summary: null,
        phone_number: null,
        birth_date: new Date('1990-01-01'),
        updated_at: '2024-01-19T00:00:00Z'
    };

    beforeEach(() => {
        // Reset the userProfile$ before each test
        clearUserProfile();
    });

    describe('getUserProfile', () => {
        it('should return null when no profile is set', () => {
            expect(getUserProfile()).toBeNull();
        });

        it('should return the current profile when set', () => {
            setUserProfile(mockProfile);
            expect(getUserProfile()).toEqual(mockProfile);
        });
    });

    describe('setUserProfile', () => {
        it('should set the user profile', () => {
            setUserProfile(mockProfile);
            expect(userProfile$.get()).toEqual(mockProfile);
        });

        it('should override existing profile', () => {
            const initialProfile = { ...mockProfile, full_name: 'Initial Name' };
            const updatedProfile = { ...mockProfile, full_name: 'Updated Name' };

            setUserProfile(initialProfile);
            setUserProfile(updatedProfile);

            expect(userProfile$.get()).toEqual(updatedProfile);
        });
    });

    describe('updateUserProfile', () => {
        it('should return false when no profile exists', () => {
            const result = updateUserProfile({ full_name: 'New Name' });
            expect(result).toBe(false);
            expect(getUserProfile()).toBeNull();
        });

        it('should update specific fields and return true', () => {
            setUserProfile(mockProfile);
            const updates = {
                full_name: 'Updated Name',
                phone_number: '+1234567890'
            };

            const result = updateUserProfile(updates);

            expect(result).toBe(true);
            expect(getUserProfile()).toMatchObject({
                ...mockProfile,
                ...updates,
                updated_at: expect.any(String)
            });
            // Verify updated_at was changed
            expect(getUserProfile()?.updated_at).not.toBe(mockProfile.updated_at);
        });

        it('should preserve unmodified fields', () => {
            setUserProfile(mockProfile);
            updateUserProfile({ full_name: 'Updated Name' });

            const updatedProfile = getUserProfile();
            expect(updatedProfile?.phone_number).toBe(mockProfile.phone_number);
            expect(updatedProfile?.website).toBe(mockProfile.website);
            expect(updatedProfile?.avatar_url).toBe(mockProfile.avatar_url);
        });
    });

    describe('clearUserProfile', () => {
        it('should clear the profile', () => {
            setUserProfile(mockProfile);
            clearUserProfile();
            expect(getUserProfile()).toBeNull();
        });

        it('should be safe to call when profile is already null', () => {
            clearUserProfile();
            clearUserProfile();
            expect(getUserProfile()).toBeNull();
        });
    });
}); 