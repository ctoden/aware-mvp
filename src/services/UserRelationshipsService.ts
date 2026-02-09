import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {user$} from "@src/models/SessionModel";
import {
    clearUserRelationships,
    removeUserRelationship,
    upsertUserRelationship,
    UserRelationship,
    userRelationships$
} from "@src/models/UserRelationship";
import {generateUUID} from "@src/utils/UUIDUtil";
import {err, ok, Result} from "neverthrow";
import {singleton} from "tsyringe";
import {DataService} from "./DataService";
import {EventAwareService} from "./EventAwareService";
import {
    RelationshipsOnUserAssessmentChangeAction
} from "@src/actions/relationships/RelationshipsOnUserAssessmentChangeAction";
import {LlmService} from "./LlmService";
import {ChangeEvent, ChangeType} from "@src/events/ChangeEvent";
import {GenerateDataService} from "./GenerateDataService";
import {FetchUserRelationshipsAction} from "@src/actions/relationships/FetchUserRelationshipsAction";
import {GenerateUserRelationshipsAction} from "@src/actions/relationships/GenerateUserRelationshipsAction";

/**
 * Contract interface for the UserRelationshipsService, if needed by other services or test providers.
 */
export interface IUserRelationshipsService {
    fetchUserRelationships(userId: string): Promise<Result<UserRelationship[], Error>>;
    createUserRelationship(relationship: Omit<UserRelationship, "id"|"created_at"|"updated_at">): Promise<Result<UserRelationship, Error>>;
    updateUserRelationship(id: string, updates: Partial<UserRelationship>): Promise<Result<UserRelationship, Error>>;
    deleteUserRelationship(id: string): Promise<Result<boolean, Error>>;
    clearLocalRelationships(): void;
    clearUserRelationships(): Promise<Result<boolean, Error>>;
}

@singleton()
export class UserRelationshipsService extends EventAwareService implements IUserRelationshipsService {
    private readonly _dataService!: DataService;
    private readonly _llmService!: LlmService;
    private readonly _generateDataService!: GenerateDataService;

    constructor() {
        super('UserRelationshipsService', [
            ChangeType.USER_ASSESSMENT,
            ChangeType.LOGIN,
            ChangeType.FTUX
        ]);
        this._dataService = this.addDependency(DataService);
        this._llmService = this.addDependency(LlmService);
        this._generateDataService = this.addDependency(GenerateDataService);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {}

    protected async onInitialize?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        try {
            if(!this._llmService || !this._llmService.llmProvider) {
                return err(new Error("LLM Service did not initialize"));
            }

            // Group related events that need the same actions
            const fetchEvents = [ChangeType.LOGIN];
            const generateEvents = [ChangeType.USER_PROFILE_GENERATE_SUMMARY];
            const assessmentEvents = [ChangeType.USER_ASSESSMENT];
            
            // Register actions with GenerateDataService
            // 1. FetchUserRelationshipsAction for auth-related events
            fetchEvents.forEach(eventType => {
                this._generateDataService.registerActions(eventType, [
                    new FetchUserRelationshipsAction(this)
                ]);
            });
            
            // 2. GenerateUserRelationshipsAction for generation events
            const llmProvider = this._llmService.llmProvider;
            generateEvents.forEach(eventType => {
                this._generateDataService.registerActions(eventType, [
                    new GenerateUserRelationshipsAction(this, llmProvider)
                ]);
            });
            
            // 3. RelationshipsOnUserAssessmentChangeAction for assessment events
            assessmentEvents.forEach(eventType => {
                this._generateDataService.registerActions(eventType, [
                    new RelationshipsOnUserAssessmentChangeAction(this, llmProvider)
                ]);
            });

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async onEnd?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        clearUserRelationships();
        return ok(true);
    }

    /**
     * Fetch the current user's relationships & store them in the local observable state.
     */
    async fetchUserRelationships(userId: string): Promise<Result<UserRelationship[], Error>> {
        try {
            const result = await this._dataService.fetchData<UserRelationship>("user_relationships", {
                filter: [{ field: "user_id", value: userId }]
            });
            if (result.isErr()) {
                return err(result.error);
            }
            // Update local observable with the fetched relationships
            const newMap: Record<string, UserRelationship> = {};
            result.value.forEach((rel) => {
                newMap[rel.id] = rel;
            });
            userRelationships$.set(newMap);

            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error("Failed to fetch user relationships"));
        }
    }

    /**
     * Create a relationship for the current user, in Supabase & local store.
     */
    async createUserRelationship(
        relationship: Omit<UserRelationship, "id"|"created_at"|"updated_at">
    ): Promise<Result<UserRelationship, Error>> {
        const user = user$.peek();
        if (!user?.id) {
            return err(new Error("No user is signed in"));
        }

        const newRelationship: UserRelationship = {
            ...relationship,
            id: generateUUID(),
            user_id: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const insertResult = await this._dataService.upsertData<UserRelationship>("user_relationships", [newRelationship]);
        if (insertResult.isErr()) {
            return err(insertResult.error);
        }
        // Update local store
        upsertUserRelationship(newRelationship);

        return ok(newRelationship);
    }

    /**
     * Update an existing relationship. We check local store for the original record, apply partial updates, then call Supabase.
     */
    async updateUserRelationship(
        id: string,
        updates: Partial<UserRelationship>
    ): Promise<Result<UserRelationship, Error>> {
        const user = user$.peek();
        if (!user?.id) {
            return err(new Error("No user is signed in"));
        }

        const existingRelationships = userRelationships$.peek();
        if (!existingRelationships) {
            return err(new Error("No relationships found"));
        }

        const existingRelationship = existingRelationships[id];
        if (!existingRelationship) {
            return err(new Error("Relationship not found"));
        }

        const updatedRelationship: UserRelationship = {
            ...existingRelationship,
            ...updates,
            updated_at: new Date().toISOString()
        };

        const updateResult = await this._dataService.updateData<UserRelationship>("user_relationships", updatedRelationship);
        if (updateResult.isErr()) {
            return err(updateResult.error);
        }

        // Update local store
        upsertUserRelationship(updatedRelationship);

        return ok(updatedRelationship);
    }

    /**
     * Delete a relationship from Supabase & the local store.
     */
    async deleteUserRelationship(id: string): Promise<Result<boolean, Error>> {
        const user = user$.peek();
        if (!user?.id) {
            return err(new Error("No user is signed in"));
        }

        // Attempt to delete from DB
        const deleteResult = await this._dataService.deleteData("user_relationships", {
            filter: [
                { field: "id", value: id },
                { field: "user_id", value: user.id }
            ]
        });
        if (deleteResult.isErr()) {
            return err(deleteResult.error);
        }

        removeUserRelationship(id);
        return ok(true);
    }

    /**
     * Clear local store only. Does NOT delete from DB.
     */
    clearLocalRelationships(): void {
        clearUserRelationships();
    }

    async clearUserRelationships(): Promise<Result<boolean, Error>> {
        try {
            const userId = user$.peek()?.id;
            if (!userId) {
                return err(new Error("User not logged in"));
            }

            // Clear local state
            clearUserRelationships();

            // Clear remote data using the correct collection name and filter
            const result = await this._dataService.deleteData("user_relationships", {
                filter: [{ field: "user_id", value: userId }]
            });
            if (result.isErr()) {
                return err(result.error);
            }

            return ok(true);
        } catch (error) {
            return err(error as Error);
        }
    }
} 