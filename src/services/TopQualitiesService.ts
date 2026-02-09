import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { user$ } from "@src/models/SessionModel";
import { clearQualities, removeQuality, setQualityColor, setQualityLevel, upsertQuality, userTopQualities$, UserTopQuality } from "@src/models/UserTopQuality";
import { generateUUID } from "@src/utils/UUIDUtil";
import { err, ok, Result } from "neverthrow";
import { singleton } from "tsyringe";
import { DataService } from "./DataService";
import { userAssessments$ } from "@src/models/UserAssessment";
import {ITopQualitiesService, TopQualitiesCrudAction} from "@src/actions/topQualities/TopQualitiesCrudAction";
import { LlmService } from "@src/services/LlmService";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";
import { GenerateDataService } from "@src/services/GenerateDataService";

@singleton()
export class TopQualitiesService extends EventAwareService implements ITopQualitiesService {
    private readonly _dataService!: DataService;
    private readonly _generateDataService!: GenerateDataService;

    constructor() {
        super('TopQualitiesService', [ChangeType.LOGIN]);
        this._dataService = this.addDependency(DataService);
        this._generateDataService = this.addDependency(GenerateDataService);
        this.addDependency(LlmService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this._generateDataService.registerActions(
            ChangeType.USER_PROFILE_GENERATE_SUMMARY,
            [new TopQualitiesCrudAction(this)]
        );
        
        return ok(true);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
        // Handle auth login - fetch qualities
        if (event.type === ChangeType.LOGIN) {
            const currentUser = user$.peek();
            if (!currentUser || !currentUser.id) {
                console.warn("TopQualitiesService: No user ID available after login");
                return;
            }
            
            const result = await this.fetchUserTopQualities(currentUser.id);
            if (result.isOk()) {
                userTopQualities$.set(result.value.reduce((acc, quality) => {
                    acc[quality.id] = quality;
                    return acc;
                }, {} as Record<string, UserTopQuality>));
            } else {
                console.error(`Failed to fetch top qualities: ${result.error.message}`);
            }
        }
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        // No additional subscriptions needed as we're now using the model change events
        return ok(true);
    }

    async fetchUserTopQualities(userId: string): Promise<Result<UserTopQuality[], Error>> {
        try {
            const result = await this._dataService.fetchData<UserTopQuality>('user_top_qualities', {
                filter: [{ field: 'user_id', value: userId }]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            // Update the observable state
            const qualitiesMap = result.value.reduce((acc, quality) => {
                acc[quality.id] = quality;
                return acc;
            }, {} as Record<string, UserTopQuality>);
            userTopQualities$.set(qualitiesMap);
            


            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to fetch top qualities'));
        }
    }

    async createTopQuality(quality: Omit<UserTopQuality, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Result<UserTopQuality, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const id = generateUUID();
        if (!id) {
            return err(new Error('Failed to generate UUID'));
        }

        const newQuality: UserTopQuality = {
            ...quality,
            id,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Set level and color before saving
        setQualityLevel(newQuality);
        setQualityColor(newQuality);

        try {
            const result = await this._dataService.upsertData<UserTopQuality>('user_top_qualities', [newQuality]);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertQuality(newQuality);
            

            
            return ok(newQuality);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create top quality'));
        }
    }

    async updateTopQuality(id: string, updates: Partial<Omit<UserTopQuality, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Result<UserTopQuality, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const currentQualities = userTopQualities$.peek();
        const existingQuality = currentQualities?.[id];
        if (!existingQuality) {
            return err(new Error('Top quality not found'));
        }

        const updatedQuality: UserTopQuality = {
            ...existingQuality,
            ...updates,
            updated_at: new Date().toISOString()
        };

        // If score was updated, recalculate level
        if (updates.score !== undefined) {
            setQualityLevel(updatedQuality);
        }

        // If title was updated or color is missing, update color
        if (updates.title !== undefined || !updatedQuality.color) {
            setQualityColor(updatedQuality);
        }

        try {
            const result = await this._dataService.updateData<UserTopQuality>('user_top_qualities', updatedQuality);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertQuality(updatedQuality);
            

            
            return ok(updatedQuality);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to update top quality'));
        }
    }

    async deleteTopQuality(id: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        try {
            const result = await this._dataService.deleteData('user_top_qualities', {
                filter: [
                    { field: 'id', value: id },
                    { field: 'user_id', value: userId }
                ]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            removeQuality(id);
            

            
            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to delete top quality'));
        }
    }

    async clearTopQualities(): Promise<Result<boolean, Error>> {
        const currentQualities = userTopQualities$.peek();
        if (!currentQualities) {
            return ok(true);
        }

        // Make a copy of the current qualities
        const qualitiesToDelete = Object.values(currentQualities);

        // Clear the observable first
        clearQualities();
        
        // Delete each quality from the data provider
        for (const quality of qualitiesToDelete) {
            const result = await this.deleteTopQuality(quality.id);
            if (result.isErr()) {
                console.error(`Failed to delete quality ${quality.id}:`, result.error);
            }
        }




        return ok(true);
    }
} 