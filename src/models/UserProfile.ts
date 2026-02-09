import {observable} from '@legendapp/state';
import {Database} from './database.types';

// Extend the database type to ensure proper date handling
export type UserProfile = Omit<Database['public']['Tables']['user_profiles']['Row'], 'birth_date'> & {
    birth_date: Date | null;
    has_completed_intro?: boolean;
    has_completed_ftux?: boolean;
    ftux_current_step?: number;
};

export const userProfile$ = observable<UserProfile | null>(null);

// Add this type for clarity of what fields are available
export interface UserProfileData {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    website: string | null;
    summary: string | null;
    phone_number: string | null;
    birth_date: Date | null;
    updated_at: string | null;
    family_story: string | null;
    primary_occupation: string | null;
    has_completed_intro: boolean;
    has_completed_ftux: boolean;
    ftux_current_step: number;
}

/**
 * Gets the current user profile
 * @returns The current user profile or null if not set
 */
export function getUserProfile(): UserProfile | null {
    return userProfile$.get();
}

/**
 * Sets the user profile, replacing any existing profile
 * @param profile The profile to set
 */
export function setUserProfile(profile: UserProfile): void {
    // Ensure birth_date is properly converted to Date if it's a string
    userProfile$.set(profile);
}

/**
 * Updates specific fields of the user profile
 * @param updates Partial profile updates to apply
 * @returns true if profile was updated, false if no profile exists
 */
export function updateUserProfile(updates: Partial<UserProfile>): boolean {
    const currentProfile = userProfile$.get();
    if (!currentProfile) {
        console.error('updateUserProfile: No current profile exists');
        return false;
    }
    
    try {
        console.log('Updating user profile with:', updates);
        const updatedProfile = {
            ...currentProfile,
            ...updates,
            updated_at: new Date().toISOString()
        };
        console.log('Updated profile:', updatedProfile);
        userProfile$.set(updatedProfile);
        return true;
    } catch (error) {
        console.error('Error updating user profile:', error);
        return false;
    }
}

/**
 * Clears the current user profile
 */
export function clearUserProfile(): void {
    userProfile$.set(null);
}
