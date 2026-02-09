import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { DataService } from "./DataService";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";
import { GenerateDataService } from "./GenerateDataService";
import { UserAboutYou, userAboutYou$, clearAboutYouEntries, upsertAboutYouEntry, AboutYouSectionType, removeAboutYouEntry } from "@src/models/UserAboutYou";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "@src/utils/UUIDUtil";
import { IAboutYouService } from "@src/actions/aboutYou/IAboutYouService";
import { FetchAboutYouAction } from "@src/actions/aboutYou/FetchAboutYouAction";
import { GenerateAboutYouAction } from "@src/actions/aboutYou/GenerateAboutYouAction";
import { LlmService } from "./LlmService";

@singleton()
export class AboutYouService extends EventAwareService implements IAboutYouService {
    private readonly _dataService!: DataService;
    private readonly _generateDataService!: GenerateDataService;
    private readonly _llmService!: LlmService;

    constructor() {
        super('AboutYouService', []);
        this._dataService = this.addDependency(DataService);
        this._generateDataService = this.addDependency(GenerateDataService);
        this._llmService = this.addDependency(LlmService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Register actions for auth changes
        this._generateDataService.registerActions(
            ChangeType.LOGIN,
            [new FetchAboutYouAction(this)]
        );

        // Register actions for FTUX changes
        this._generateDataService.registerActions(
            ChangeType.FTUX_COMPLETE,
            [new GenerateAboutYouAction(this, this._llmService.llmProvider!)]
        );

        // Register actions for assessment changes
        this._generateDataService.registerActions(
            ChangeType.USER_ASSESSMENT,
            [new GenerateAboutYouAction(this, this._llmService.llmProvider!)]
        );

        // Ensure we clean up any excess entries from previous sessions
        const limitResult = await this.limitAboutYouEntries();
        if (limitResult.isErr()) {
            console.warn('Failed to limit AboutYou entries on init:', limitResult.error.message);
        }

        return ok(true);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
        // No additional state changes needed for AboutYouService
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        // No additional subscriptions needed as we now use actions
        return ok(true);
    }

    async clearAboutYouEntries(): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        try {
            // Delete all entries from the database first
            const deleteResult = await this._dataService.deleteData('user_about_you', {
                filter: [{ field: 'user_id', value: userId }]
            });
            
            if (deleteResult.isErr()) {
                return err(deleteResult.error);
            }
            
            // Clear local state only after successful database deletion
            clearAboutYouEntries();
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to clear about you entries'));
        }
    }

    async createAboutYouEntry(entry: { title: string; description: string }, sectionType: AboutYouSectionType): Promise<Result<UserAboutYou, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const newEntry: UserAboutYou = {
            id: generateUUID(),
            user_id: userId,
            title: entry.title,
            description: entry.description,
            section_type: sectionType,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.upsertData<UserAboutYou>('user_about_you', [newEntry]);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertAboutYouEntry(newEntry);
            return ok(newEntry);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create about you entry'));
        }
    }

    async fetchAboutYouEntries(): Promise<Result<UserAboutYou[], Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        try {
            const result = await this._dataService.fetchData<UserAboutYou>('user_about_you', {
                filter: [{ field: 'user_id', value: userId }]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            console.log("~~~ AboutYouService: : FetchAboutYouAction: fetchAboutYouEntries: result", result.value);

            // Update local state
            result.value.forEach(entry => {
                upsertAboutYouEntry(entry);
            });

            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to fetch about you entries'));
        }
    }

    async limitAboutYouEntries(): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        try {
            // Fetch all current entries
            const fetchResult = await this.fetchAboutYouEntries();
            if (fetchResult.isErr()) {
                return err(fetchResult.error);
            }

            const entries = fetchResult.value;
            const entriesBySection = new Map<AboutYouSectionType, UserAboutYou[]>();

            // Group entries by section
            entries.forEach(entry => {
                const sectionEntries = entriesBySection.get(entry.section_type) || [];
                sectionEntries.push(entry);
                entriesBySection.set(entry.section_type, sectionEntries);
            });

            // Identify entries to delete (keeping only 5 most recent per section)
            const entriesToDelete: string[] = [];
            
            for (const [sectionType, sectionEntries] of entriesBySection.entries()) {
                // Sort by created_at in descending order (newest first)
                const sortedEntries = sectionEntries.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                
                // Keep only the 5 newest entries
                if (sortedEntries.length > 5) {
                    const excessEntries = sortedEntries.slice(5);
                    excessEntries.forEach(entry => entriesToDelete.push(entry.id));
                }
            }

            // Delete excess entries
            if (entriesToDelete.length > 0) {
                for (const id of entriesToDelete) {
                    await this._dataService.deleteData('user_about_you', {
                        filter: [{ field: 'id', value: id }]
                    });
                    
                    // Also remove from local state
                    removeAboutYouEntry(id);
                }
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to limit about you entries'));
        }
    }
} 