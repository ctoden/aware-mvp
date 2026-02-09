import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { DataService } from "./DataService";
import { IMotivation } from "@src/models/UserMotivation";
import { UserMotivation, MotivationType, userMotivations$, upsertMotivation, removeMotivation, clearMotivations } from "@src/models/UserMotivation";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "@src/utils/UUIDUtil";
import { userAssessments$ } from "@src/models/UserAssessment";
import { MotivationsOnUserAssessmentChangeAction } from "@src/actions/motivations/MotivationsOnUserAssessmentChangeAction";
import { LlmService } from "@src/services/LlmService";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";
import { MotivationsActionService } from "@src/actions/motivations/MotivationsActionService.interface";
import { GenerateDataService } from "./GenerateDataService";
import { FetchMotivationsAction } from "@src/actions/motivations/FetchMotivationsAction";
import { GenerateMotivationsAction } from "@src/actions/motivations/GenerateMotivationsAction";

@singleton()
export class MotivationsService extends EventAwareService implements MotivationsActionService {
    private readonly _dataService!: DataService;
    private readonly _generateDataService!: GenerateDataService;
    private readonly _llmService!: LlmService;

    constructor() {
        super('MotivationsService', []);
        this._dataService = this.addDependency(DataService);
        this._llmService = this.addDependency(LlmService);
        this._generateDataService = this.addDependency(GenerateDataService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Register actions with GenerateDataService
        this._generateDataService.registerActions(
            ChangeType.LOGIN, 
            [new FetchMotivationsAction(this)]
        );
        
        this._generateDataService.registerActions(
            ChangeType.USER_PROFILE_GENERATE_SUMMARY, 
            [new GenerateMotivationsAction(this)]
        );
        
        this._generateDataService.registerActions(
            ChangeType.USER_ASSESSMENT, 
            [new MotivationsOnUserAssessmentChangeAction(this)]
        );
        
        return ok(true);
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        userMotivations$.set(null);
        return ok(true);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
        // The actions are now handled by GenerateDataService
        // We still need to handle specific model changes that aren't covered by actions
        switch (event.type) {
            case ChangeType.MOTIVATIONS:
                // Handle any specific logic when motivations change
                break;
        }
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        // No additional subscriptions needed as we're now using the model change events
        return ok(true);
    }

    async fetchUserMotivations(userId: string): Promise<Result<UserMotivation[], Error>> {
        try {
            const result = await this._dataService.fetchData<UserMotivation>('user_motivations', {
                filter: [{ field: 'user_id', value: userId }]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            // Update the observable state
            const valuesMap = result.value.reduce((acc, value) => {
                acc[value.id] = value;
                return acc;
            }, {} as Record<string, UserMotivation>);
            userMotivations$.set(valuesMap);
            


            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to fetch motivations'));
        }
    }

    async createMotivations(values: IMotivation[], type: MotivationType = MotivationType.SYSTEM_GENERATED): Promise<Result<UserMotivation[], Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const newMotivations: UserMotivation[] = values.map(value => ({
            id: generateUUID(),
            user_id: userId,
            title: value.title,
            description: value.description,
            motivation_type: type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        try {
            const result = await this._dataService.upsertData<UserMotivation>('user_motivations', newMotivations);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            for (const motivation of newMotivations) {
                upsertMotivation(motivation);
            }
            

            
            return ok(newMotivations);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create motivations'));
        }
    }

    async createMotivation(value: IMotivation, type: MotivationType = MotivationType.SYSTEM_GENERATED): Promise<Result<UserMotivation, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const newMotivation: UserMotivation = {
            id: generateUUID(),
            user_id: userId,
            title: value.title,
            description: value.description,
            motivation_type: type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.upsertData<UserMotivation>('user_motivations', [newMotivation]);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertMotivation(newMotivation);
            

            
            return ok(newMotivation);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create motivation'));
        }
    }

    async updateMotivation(id: string, updates: Partial<IMotivation>): Promise<Result<UserMotivation, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const currentValues = userMotivations$.peek();
        const existingValue = currentValues?.[id];
        if (!existingValue) {
            return err(new Error('Motivation not found'));
        }

        const updatedValue: UserMotivation = {
            ...existingValue,
            ...updates,
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.updateData<UserMotivation>('user_motivations', updatedValue);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertMotivation(updatedValue);
            

            
            return ok(updatedValue);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to update motivation'));
        }
    }

    async deleteMotivation(id: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        try {
            const result = await this._dataService.deleteData('user_motivations', {
                filter: [
                    { field: 'id', value: id },
                    { field: 'user_id', value: userId }
                ]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            removeMotivation(id);
            

            
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to delete motivation'));
        }
    }

    async clearMotivations(): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('User not authenticated'));
        }

        try {
            // Delete from database
            const deleteResult = await this._dataService.deleteData('user_motivations', {
                filter: [{ field: 'user_id', value: userId }]
            });
            
            if (deleteResult.isErr()) {
                return err(deleteResult.error);
            }
            
            // Clear local state only after database operation succeeds
            clearMotivations();
            

            
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to clear motivations'));
        }
    }
} 