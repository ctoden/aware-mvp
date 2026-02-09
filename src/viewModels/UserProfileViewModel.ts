import { Observable, observable } from '@legendapp/state';
import { injectable } from 'tsyringe';
import type { UserProfile } from '../models/UserProfile';
import { userProfile$ } from '../models/UserProfile';
import { ViewModel } from './ViewModel';
import { AuthService } from '../services/AuthService';
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { err, ok, Result } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { user$ } from '@src/models/SessionModel';
import { UserProfileService } from '../services/UserProfileService';
import { ChangeType, emitChange } from '@src/events/ChangeEvent';
import { GenerateDataService } from '@src/services/GenerateDataService';

@injectable()
export class UserProfileViewModel extends ViewModel {
    private readonly _authService: AuthService;
    private readonly _userProfileService: UserProfileService;
    private readonly _generateDataService: GenerateDataService;

    // Create local observable state for form inputs
    public formState$ = observable({
        fullName: '',
        phoneNumber: '',
        birthDate: null as Date | null,
        email: '',
    });

    isLoading$ = observable<boolean>(false);
    error$ = observable<string | null>(null);
    isLoginActionsInProgress$ = observable<boolean>(false);
    isProfileDataLoading$ = observable<boolean>(false);

    constructor() {
        super("UserProfileViewModel");
        this._authService = this.addDependency(AuthService);
        this._userProfileService = this.addDependency(UserProfileService);
        this._generateDataService = this.addDependency(GenerateDataService);
    }

    get userProfile$(): Observable<UserProfile | null> {
        return userProfile$;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Request a profile refresh when the ViewModel initializes
        const currentUser = user$.peek();
        if (currentUser?.id) {
            console.log("~~~ UserProfileViewModel: Requesting profile refresh via event");
            // This follows the proper architecture by using the event system
            // Use the dedicated profile refresh event rather than a generic one
            emitChange(ChangeType.USER_PROFILE_REFRESH, { 
                user: currentUser,
                forceRefresh: true 
            }, 'user_action');
        }

        // Initialize form state with existing profile data if available
        const profile = userProfile$.get();
        if (profile) {
            this.formState$.fullName.set(profile.full_name || '');
            this.formState$.phoneNumber.set(profile.phone_number || '');
            this.formState$.birthDate.set(profile.birth_date ? new Date(profile.birth_date) : null);
            this.formState$.email.set(user$.get()?.email || '');
        }

        this.onChange(userProfile$, () => {
            const profile = userProfile$.get();
            if (profile) {
                this.formState$.fullName.set(profile.full_name || '');
                this.formState$.phoneNumber.set(profile.phone_number || '');
                this.formState$.birthDate.set(profile.birth_date ? new Date(profile.birth_date) : null);
                this.formState$.email.set(user$.get()?.email || '');
            }
        });

        // Check if login and profile actions are in progress
        await this.checkProfileActionsProgress();

        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    get firstName() {
        const fullName = this.formState$.fullName.get();
        if (!fullName) return '';
        return fullName.split(' ')[0];
    }
    get email() {
        const email = this.formState$.email.get();
        if (!email) return '';
        return email;
    }
    get phoneNumber() {
        const phoneNumber = this.formState$.phoneNumber.get();
        if (!phoneNumber) return '';
        return phoneNumber;
    }

    async saveProfile(): Promise<Result<boolean, Error>> {
        this.isLoading$.set(true);
        this.error$.set(null);

        try {
            const currentUser = user$.get();
            if (!currentUser?.id) {
                return err(new Error('No user logged in'));
            }

            const currentProfile = userProfile$.get();
            const updatedProfile: UserProfile = {
                id: currentUser.id,  // Use the current user's ID
                full_name: this.formState$.fullName.get(),
                phone_number: this.formState$.phoneNumber.get(),
                birth_date: this.formState$.birthDate.get() || null,
                avatar_url: currentProfile?.avatar_url || null,
                updated_at: new Date().toISOString(),
                website: currentProfile?.website || null,
                summary: currentProfile?.summary || null,
                family_story: currentProfile?.family_story || null,
                primary_occupation: currentProfile?.primary_occupation || null
            };

            userProfile$.set(updatedProfile);
            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            this.isLoading$.set(false);
        }
    }

    /**
     * Checks if the user profile needs to be refreshed and triggers the refresh if needed.
     * This delegates to the UserProfileService to handle the actual logic.
     * 
     * @returns A Result indicating success or failure
     */
    async checkProfileRefresh(): Promise<Result<boolean, Error>> {
        try {
            return await this._userProfileService.checkAndRefreshProfile();
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to check profile refresh'));
        }
    }

    /**
     * Checks if there are any login-related or profile-related actions in progress
     * in the GenerateDataService and updates the observable states
     */
    async checkProfileActionsProgress(): Promise<void> {
        const generationProgress = this._generateDataService.generationProgress$.get();
        
        // Find any LOGIN-related progress entries that are still running
        const loginProgressEntries = Object.entries(generationProgress)
            .filter(([id, progress]) => 
                id.startsWith(`${ChangeType.LOGIN}_`) && 
                progress.status === 'running'
            );
        
        // Find any profile-related progress entries that are still running
        const profileProgressEntries = Object.entries(generationProgress)
            .filter(([id, progress]) => 
                (id.startsWith(`${ChangeType.USER_PROFILE_REFRESH}_`) || 
                 id.startsWith(`${ChangeType.USER_PROFILE_GENERATE_SUMMARY}_`) ||
                 id.startsWith(`${ChangeType.USER_PROFILE}_`)) && 
                progress.status === 'running'
            );
        
        // Update the isLoginActionsInProgress$ state
        this.isLoginActionsInProgress$.set(loginProgressEntries.length > 0);
        
        // Update the isProfileDataLoading$ state
        this.isProfileDataLoading$.set(profileProgressEntries.length > 0);
        
        // Check if profile data is missing
        const profileDataMissing = !userProfile$.peek()?.summary;
        const isLoggedIn = !!user$.peek()?.id;
        
        // If profile data is missing but user is logged in, consider it as still loading
        if (profileDataMissing && isLoggedIn) {
            this.isProfileDataLoading$.set(true);
        }
        
        // If any actions are in progress, set up a timer to check again
        if (loginProgressEntries.length > 0 || profileProgressEntries.length > 0 || 
            (profileDataMissing && isLoggedIn)) {
            setTimeout(() => this.checkProfileActionsProgress(), 200);
        }
    }

    /**
     * Waits for all login and profile-related actions to complete
     * This is used to show loading indicators during the login process
     * especially when actions registered with GenerateDataService are processing
     * 
     * It checks the current state and waits for all actions to finish
     * by polling the GenerateDataService.
     * 
     * @returns Promise that resolves when all actions are completed
     */
    async waitForProfileActionsToComplete(): Promise<Result<boolean, Error>> {
        try {
            await this.checkProfileActionsProgress();
            
            const isLoading = this.isLoginActionsInProgress$.get() || this.isProfileDataLoading$.get();
            
            if (isLoading) {
                // Wait for login actions
                const loginResult = this.isLoginActionsInProgress$.get() ? 
                    await this._generateDataService.waitForChangeActions(
                        ChangeType.LOGIN,
                        30000 // 30 seconds timeout
                    ) : 
                    ok(true);
                
                if (loginResult.isErr()) {
                    return loginResult;
                }
                
                // Wait for profile refresh actions
                const profileResult = this.isProfileDataLoading$.get() ?
                    await this._generateDataService.waitForChangeActions(
                        ChangeType.USER_PROFILE_REFRESH,
                        30000 // 30 seconds timeout
                    ) :
                    ok(true);
                
                // Additional wait for summary generation if needed
                const summaryResult = this.isProfileDataLoading$.get() ?
                    await this._generateDataService.waitForChangeActions(
                        ChangeType.USER_PROFILE_GENERATE_SUMMARY,
                        30000 // 30 seconds timeout
                    ) :
                    ok(true);
                
                // Update state after waiting
                this.isLoginActionsInProgress$.set(false);
                
                // Check if profile data is available
                if (!userProfile$.peek()?.summary) {
                    // Wait a bit longer for data to be populated
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
                // Final state update
                this.isProfileDataLoading$.set(false);
                
                // Return any error that occurred
                if (profileResult.isErr()) return profileResult;
                if (summaryResult.isErr()) return summaryResult;
                
                return ok(true);
            }
            
            return ok(true);
        } catch (error) {
            this.isLoginActionsInProgress$.set(false);
            this.isProfileDataLoading$.set(false);
            return err(error instanceof Error ? error : new Error('Error waiting for profile actions'));
        }
    }

    /**
     * @deprecated Use waitForProfileActionsToComplete instead
     */
    async waitForLoginActionsToComplete(): Promise<Result<boolean, Error>> {
        return this.waitForProfileActionsToComplete();
    }
}
