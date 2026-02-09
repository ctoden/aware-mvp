import {singleton} from "tsyringe";
import {err, ok, Result} from "neverthrow";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {DataService} from "./DataService";
import {EventAwareService} from "./EventAwareService";
import {ChangeEvent, ChangeType} from "@src/events/ChangeEvent";
import {GenerateDataService} from "@src/services/GenerateDataService";
import {user$} from "@src/models/SessionModel";
import {clearUserProfile, UserProfile, userProfile$} from "@src/models/UserProfile";
import {LlmService} from "./LlmService";
import {UserProfileRefreshAction} from "@src/actions/userProfile/UserProfileRefreshAction";
import {UserProfileGenerateSummaryAction} from "@src/actions/userProfile/UserProfileGenerateSummaryAction";
import {FetchUserProfileAction} from "@src/actions/userProfile/FetchUserProfileAction";
import {LocalStorageService} from "./LocalStorageService";
import {FtuxService} from "./FtuxService";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";
import {compareTimestamps} from "@src/utils/TimestampUtils";
import {ftuxState$} from "@src/models/FtuxModel";
import {UserAssessment, userAssessments$} from "@src/models/UserAssessment";
import {cloneDeep, isNil} from "lodash";
import {USER_PROFILE_ACTION_SERVICE_DI_KEY, UserProfileActionService} from "@src/actions/userProfile/UserProfileActionService.interface";
import { DependencyService } from "@src/core/injection/DependencyService";

@singleton()
export class UserProfileService extends EventAwareService implements UserProfileActionService {
    private readonly _dataService!: DataService;
    private readonly _generateDataService!: GenerateDataService;
    private readonly _llmService!: LlmService;
    private readonly _localStorageService!: LocalStorageService;
    private readonly _ftuxService!: FtuxService;

    constructor() {
        super('UserProfileService', [
            ChangeType.USER_ASSESSMENT
        ]);
        this._dataService = this.addDependency(DataService);
        this._generateDataService = this.addDependency(GenerateDataService);
        this._llmService = this.addDependency(LlmService);
        this._localStorageService = this.addDependency(LocalStorageService);
        this._ftuxService = this.addDependency(FtuxService);

        // Register actions with GenerateDataService
        this._generateDataService.registerActions(ChangeType.USER_PROFILE_REFRESH, [
            new UserProfileRefreshAction()
        ]);

        this._generateDataService.registerActions(ChangeType.USER_PROFILE_GENERATE_SUMMARY, [
            new UserProfileGenerateSummaryAction()
        ]);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {}

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Fix linter error by not calling super.onInitialize
        
        // Register this service with its interface key
        DependencyService.registerValue(USER_PROFILE_ACTION_SERVICE_DI_KEY, this);

        // Register actions with the GenerateDataService
        // UserProfileRefreshAction handles fetching and updating profile data
        const refreshEvents = [
            ChangeType.USER_ASSESSMENT,
            ChangeType.USER_PROFILE_REFRESH
        ];
        
        refreshEvents.forEach(eventType => {
            this._generateDataService.registerActions(eventType, [
                new UserProfileRefreshAction()
            ]);
        });

        // Register FetchUserProfileAction for LOGIN changes (more specific than AUTH)
        this._generateDataService.registerActions(ChangeType.LOGIN, [
            new FetchUserProfileAction()
        ]);

        // UserProfileGenerateSummaryAction handles generating new summaries
        this._generateDataService.registerActions(ChangeType.USER_PROFILE_GENERATE_SUMMARY, [
            new UserProfileGenerateSummaryAction()
        ]);

        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        // Subscribe to profile changes to sync with data store
        this.onChange(userProfile$, (async (change) => {
            const profile = change.value;
            console.log("~~~ UserProfileService onChange: ", profile ? profile : "null");
            if (profile) {
                await this.updateProfile(profile);
            }
        }));

        return ok(true);
    }

    async fetchProfile(userId: string): Promise<Result<UserProfile | null, Error>> {
        console.log('Fetching profile for user:', userId);
        const result = await this._dataService.fetchData<UserProfile>('user_profiles', {
            filter: [{ field: 'id', value: userId }]
        });

        if (result.isErr()) {
            console.error('Error fetching profile:', result.error);
            return err(result.error);
        }

        const profiles = result.value;
        if (profiles.length > 0) {
            const profile = profiles[0];
            // Convert birth_date string to Date if it exists
            if (profile.birth_date) {
                profile.birth_date = new Date(profile.birth_date);
            }
            return ok(profile);
        }

        return ok(null);
    }

    public async updateProfileSummary(assessments: UserAssessment[]): Promise<Result<boolean, Error>> {
        // console.log("~~~~ UserProfileService initializeSubscriptions userAssessments$", assessments);
        let newAssessmentCount = 0;

        if (!assessments || assessments.length === 0) {
            console.log("~~~~ UserProfileService updateProfileSummary: assessments is empty");
            userProfile$.summary.set("Not enough information to generate a summary. Please complete some assessments.");
            userProfile$.updated_at.set(new Date().toISOString());
            return ok(true);
        }

        let prompt = "\nPersonality test results:";
        assessments.forEach(assessment => {
            const profileUpdatedAt = userProfile$.updated_at?.get();
            const result = compareTimestamps(assessment.updated_at, profileUpdatedAt);
            if (result.isOk()) {
                const comparison = result._unsafeUnwrap();
                if (comparison > 0) {
                    // assessment is newer
                    newAssessmentCount++;
                    prompt += "\n - " + assessment.assessment_type + ": " + assessment.assessment_summary;
                }
            }
        });

        if (newAssessmentCount > 0) {
            // console.log("~~~~ UserProfileService initializeSubscriptions generating profile summary, newAssessmentCount: ", newAssessmentCount);
            const summaryResults = await this._llmService.generateSummary(prompt);
            if (summaryResults.isErr()) {
                console.error("~~~ Error generating profile summary: ", summaryResults.error);
                return err(summaryResults.error);
            }
            userProfile$.summary.set(summaryResults.value);
            userProfile$.updated_at.set(new Date().toISOString());
        }
        return ok(true);
    }

    private async getCurrentUser(): Promise<Result<{ id: string }, Error>> {
        const currentUser = user$.get();
        if (!currentUser) {
            return err(new Error('No authenticated user found'));
        }
        return ok({ id: currentUser.id });
    }

    private async updateProfile(profile: UserProfile): Promise<Result<UserProfile, Error>> {
        if (isNil(profile)) {
            console.error(new Error("Profile set to null"))
            return err(new Error("Profile set to null"))
        }

        if (!profile.id) {
            const user = await this.getCurrentUser();
            if (user.isErr()) {
                return err(user.error);
            }
            profile.id = user.value.id;
        }

        profile.updated_at = new Date().toISOString();

        // Handle Date objects: convert to ISO strings for Supabase
        const profileToSave = { ...profile } as any;
        if (profileToSave.birth_date instanceof Date) {
            profileToSave.birth_date = profileToSave.birth_date.toISOString();
        }

        console.log('Updating profile with:', profileToSave);

        const result = await this._dataService.upsertData<UserProfile>('user_profiles', profileToSave);
        if (result.isErr()) {
            console.error('Error updating profile:', result.error);
            return err(result.error);
        }
        return ok(result.value[0] || profile);
    }

    // Helper method to check if we're in FTUX mode
    private isFtuxMode(): boolean {
        return !ftuxState$.hasCompletedIntro.peek();
    }

    /**
     * Checks if the profile needs refreshing and triggers the necessary updates.
     * - Always refreshes when FTUX completes
     * - Refreshes every 24 hours if needed
     * 
     * @returns Result indicating success or failure of the refresh operation
     */
    public async checkAndRefreshProfile(forceRefresh = false): Promise<Result<boolean, Error>> {
        try {
            console.log("~~~ UserProfileService: Refreshing profile");
            
            // Get current user ID
            const userResult = await this.getCurrentUser();
            if (userResult.isErr()) {
                console.log("~~~ UserProfileService: No user found, skipping profile refresh");
                return ok(false);
            }
            
            // Fetch the profile directly
            const fetchResult = await this.fetchProfile(userResult.value.id);
            if (fetchResult.isErr()) {
                console.error('Error fetching profile:', fetchResult.error);
                return err(fetchResult.error);
            }
            
            console.log("~~~ UserProfileService: Profile refreshed successfully");
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to refresh profile'));
        }
    }

    /**
     * This method is kept as a stub for interface compatibility.
     * It no longer performs any action as we've removed the refresh timestamp functionality.
     */
    public async setRefreshProfileTimestamp(): Promise<Result<boolean, Error>> {
        // This method is no longer needed but kept for interface compatibility
        return ok(true);
    }
}
