import { ChangeType, emitChange } from "@src/events/ChangeEvent";
import {UserProfile, userProfile$} from "@src/models/UserProfile";
import {familyStory$} from "@src/models/FamilyStoryModel";
import {careerJourneyEntries$} from "@src/models/CareerJourneyModel";
import {userMainInterests$} from "@src/models/UserMainInterest";
import {UserAssessment, userAssessments$} from "@src/models/UserAssessment";
import {ftuxState$} from "@src/models/FtuxModel";
import {user$} from "@src/models/SessionModel";
import {GenerateDataService} from "@src/services/GenerateDataService";

import {
    generateMockAssessments,
    generateMockCareerJourney,
    generateMockFamilyStory,
    generateMockInterests,
    generateMockProfile,
    generateMockUser
} from "./MockDataGenerator";
import {DependencyService} from "@src/core/injection/DependencyService";

/**
 * Initialize basic test state with a user and empty models
 * @param overrides Optional values to override defaults
 * @returns The generated user and profile objects
 */
export const initializeTestState = (overrides: {
    user?: any;
    profile?: Partial<UserProfile>;
} = {}) => {
    // Clear state
    user$.set(null);
    userProfile$.set(null);
    userAssessments$.set([]);
    ftuxState$.hasCompletedFTUX.set(false);
    ftuxState$.hasCompletedIntro.set(false);
    familyStory$.set({ story: '' });
    careerJourneyEntries$.set([]);
    userMainInterests$.set(null);
    
    // Create user
    const mockUser = overrides.user || generateMockUser();
    user$.set(mockUser);
    
    // Create profile
    const mockProfile = generateMockProfile(mockUser.id, overrides.profile || {});
    userProfile$.set(mockProfile);
    
    return { mockUser, mockProfile };
};

/**
 * Complete the FTUX flow by setting all needed data
 * @param userId User ID to associate data with
 * @param waitTime Time to wait between steps (in ms)
 */
export const completeFtuxFlow = async (userId: string, waitTime: number = 50) => {
    // 1. Mark intro completed
    ftuxState$.hasCompletedIntro.set(true);
    await waitForAsync(waitTime);
    
    // 2. Update user profile information
    const currentProfile = userProfile$.get() || generateMockProfile(userId);
    const updatedProfile: UserProfile = {
        ...currentProfile,
        full_name: 'Alex Johnson',
        birth_date: null, // Use null for date to avoid type issues
        avatar_url: 'https://example.com/avatar.jpg',
        primary_occupation: 'Software Engineer',
        updated_at: new Date().toISOString()
    };
    userProfile$.set(updatedProfile);
    emitChange(ChangeType.USER_PROFILE, updatedProfile, 'system');
    await waitForAsync(waitTime);
    
    // 3. Add family story
    familyStory$.set(generateMockFamilyStory());
    await waitForAsync(waitTime);
    
    // 4. Add career journey
    careerJourneyEntries$.set(generateMockCareerJourney());
    await waitForAsync(waitTime);
    
    // 5. Add main interests
    userMainInterests$.set(generateMockInterests(userId));
    emitChange(ChangeType.MAIN_INTEREST, userMainInterests$.get(), 'system');
    await waitForAsync(waitTime);
    
    // 6. Add assessments
    const assessments = generateMockAssessments(userId);
    userAssessments$.set(assessments);
    emitChange(ChangeType.USER_ASSESSMENT, assessments, 'system');
    await waitForAsync(waitTime);
    
    // 7. Mark FTUX completed
    ftuxState$.hasCompletedFTUX.set(true);
    emitChange(ChangeType.FTUX, { hasCompletedFTUX: true }, 'system');
    await waitForChangeActions(ChangeType.FTUX);
    
    return {
        updatedProfile,
        assessments
    };
};

/**
 * Set up assessments for a user
 * @param userId User ID to associate with assessments
 * @param count Number of assessments to generate
 * @param overrides Optional values to override defaults
 */
export const setupAssessments = (
    userId: string, 
    count: number = 2,
    overrides: Partial<UserAssessment> = {}
) => {
    const assessments = generateMockAssessments(userId, count, overrides);
    userAssessments$.set(assessments);
    emitChange(ChangeType.USER_ASSESSMENT, assessments, 'system');
    return assessments;
};

/**
 * Set up assessments for a user and wait for related actions to complete
 * @param userId User ID to associate with assessments
 * @param count Number of assessments to generate
 * @param overrides Optional values to override defaults
 */
export const setupAssessmentsAndWait = async (
    userId: string, 
    count: number = 2,
    overrides: Partial<UserAssessment> = {}
): Promise<UserAssessment[]> => {
    const assessments = setupAssessments(userId, count, overrides);
    await waitForChangeActions(ChangeType.USER_ASSESSMENT);
    return assessments;
};

/**
 * Create a promise that resolves after the specified time
 * @param ms Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
const waitForAsync = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Waits for actions triggered by a specific change type to complete
 * @param changeType The type of change to wait for
 * @param timeoutMs Maximum time to wait in milliseconds
 * @returns Promise that resolves when actions are completed or timeout is reached
 */
export const waitForChangeActions = async (
    changeType: ChangeType,
    timeoutMs: number = 10000
): Promise<void> => {
    const generateDataService = DependencyService.resolve(GenerateDataService);
    const result = await generateDataService.waitForChangeActions(changeType, timeoutMs);
    
    // If there was an error, log it but don't throw to maintain backward compatibility
    if (result.isErr()) {
        console.error(`Error waiting for change actions: ${result.error.message}`);
    }
};

/**
 * Sets up the FTUX flow specifically for core values testing
 * This is a simplified version of completeFtuxFlow focused on core values
 * @param userId User ID to associate data with
 * @returns A promise that resolves when the setup is complete
 */
export const setupFtuxForCoreValues = async (userId: string): Promise<void> => {
    // Mark intro completed
    ftuxState$.hasCompletedIntro.set(true);
    
    // Set up profile
    const mockProfile = generateMockProfile(userId);
    userProfile$.set(mockProfile);
    emitChange(ChangeType.USER_PROFILE, mockProfile, 'system');
    
    // Add assessments
    const assessments = generateMockAssessments(userId);
    userAssessments$.set(assessments);
    emitChange(ChangeType.USER_ASSESSMENT, assessments, 'system');
    
    // Mark FTUX completed
    ftuxState$.hasCompletedFTUX.set(true);
    emitChange(ChangeType.FTUX, { hasCompletedFTUX: true }, 'system');
    
    // Wait for FTUX completion to be processed
    await waitForChangeActions(ChangeType.FTUX);
}; 