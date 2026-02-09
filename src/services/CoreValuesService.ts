import { CoreValuesOnUserAssessmentChangeAction } from "@src/actions/coreValues/CoreValuesOnUserAssessmentChangeAction";
import { CreateCoreValuesAction } from "@src/actions/coreValues/CreateCoreValuesAction";
import { FetchCoreValuesAction } from "@src/actions/coreValues/FetchCoreValuesAction";
import { ICoreValuesService } from "@src/actions/coreValues/ICoreValuesService";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { ChangeEvent, ChangeType, emitChange } from "@src/events/ChangeEvent";
import { user$ } from "@src/models/SessionModel";
import {
    clearCoreValues,
    CoreValueType,
    ICoreValue,
    removeCoreValue,
    upsertCoreValue,
    UserCoreValue,
    userCoreValues$,
    getUserCoreValuesArray
} from "@src/models/UserCoreValue";
import { LlmService } from "@src/services/LlmService";
import { generateUUID } from "@src/utils/UUIDUtil";
import { err, ok, Result } from "neverthrow";
import { singleton } from "tsyringe";
import { DataService } from "@src/services/DataService";
import { EventAwareService } from "./EventAwareService";
import { GenerateDataService } from "./GenerateDataService";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";

@singleton()
export class CoreValuesService extends EventAwareService implements ICoreValuesService {
    private readonly _dataService!: DataService;
    private readonly _generateDataService!: GenerateDataService;
    private readonly _llmService!: LlmService;

    constructor() {
        super('CoreValuesService', []);
        this._dataService = this.addDependency(DataService);
        this._generateDataService = this.addDependency(GenerateDataService);
        this._llmService = this.addDependency(LlmService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if(!this._llmService || !this._llmService.llmProvider) {
            return err(new Error("~~~ LLM Service did not initialize"));
        }

        // Register actions for login changes (more specific than general AUTH)
        this._generateDataService.registerActions(
            ChangeType.LOGIN,
            [new FetchCoreValuesAction(this)]
        );

        // Register actions for assessment changes
        this._generateDataService.registerActions(
            ChangeType.USER_ASSESSMENT,
            [new CoreValuesOnUserAssessmentChangeAction(this)]
        );

        // Register actions for profile summary generation
        this._generateDataService.registerActions(
            ChangeType.USER_PROFILE_GENERATE_SUMMARY,
            [new CreateCoreValuesAction(this._llmService.llmProvider, this)]
        );

        return BR_TRUE;
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        userCoreValues$.set(null);
        return ok(true);
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        // No additional subscriptions needed as we're now using the model change events
        return ok(true);
    }

    async fetchUserCoreValues(userId: string): Promise<Result<UserCoreValue[], Error>> {
        try {
            const result = await this._dataService.fetchData<UserCoreValue>('user_core_values', {
                filter: [{ field: 'user_id', value: userId }]
            });

            // console.log("~~~ CoreValuesService: Fetching user core values for user", userId);

            if (result.isErr()) {
                console.error("~~~ CoreValuesService: Error fetching user core values", result.error);
                return err(result.error);
            }

            // console.log("~~~ CoreValuesService: User core values fetched successfully", result.value);

            // Update the observable state
            const valuesMap = result.value.reduce((acc, value) => {
                acc[value.id] = value;
                return acc;
            }, {} as Record<string, UserCoreValue>);
            userCoreValues$.set(valuesMap);
            
            // console.log("~~~ CoreValuesService: User core values set successfully", getUserCoreValuesArray());

            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to fetch core values'));
        }
    }

    async createCoreValue(value: ICoreValue, type: CoreValueType = CoreValueType.SYSTEM_GENERATED): Promise<Result<UserCoreValue, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const newCoreValue: UserCoreValue = {
            id: generateUUID(),
            user_id: userId,
            title: value.title,
            description: value.description,
            value_type: type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.upsertData<UserCoreValue>('user_core_values', [newCoreValue]);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertCoreValue(newCoreValue);
            

            
            return ok(newCoreValue);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create core value'));
        }
    }

    async updateCoreValue(id: string, updates: Partial<ICoreValue>): Promise<Result<UserCoreValue, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const currentValues = userCoreValues$.peek();
        const existingValue = currentValues?.[id];
        if (!existingValue) {
            return err(new Error('Core value not found'));
        }

        const updatedValue: UserCoreValue = {
            ...existingValue,
            ...updates,
            updated_at: new Date().toISOString()
        };

        try {
            const result = await this._dataService.updateData<UserCoreValue>('user_core_values', updatedValue);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            upsertCoreValue(updatedValue);
            

            
            return ok(updatedValue);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to update core value'));
        }
    }

    async deleteCoreValue(id: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        try {
            const result = await this._dataService.deleteData('user_core_values', {
                filter: [
                    { field: 'id', value: id },
                    { field: 'user_id', value: userId }
                ]
            });

            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            removeCoreValue(id);
            

            
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to delete core value'));
        }
    }

    async clearCoreValues(): Promise<Result<boolean, Error>> {
        // Clear existing core values before adding new ones
        clearCoreValues();
        

        
        return ok(true);
    }

    async createCoreValues(values: ICoreValue[], type: CoreValueType = CoreValueType.SYSTEM_GENERATED): Promise<Result<UserCoreValue[], Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        // Take only the last 3 values if more than 3 are provided
        const valuesToCreate = values.slice(-3);
        
        const newCoreValues: UserCoreValue[] = valuesToCreate.map(value => ({
            id: generateUUID(),
            user_id: userId,
            title: value.title,
            description: value.description,
            value_type: type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));


        try {
            const result = await this._dataService.upsertData<UserCoreValue>('user_core_values', newCoreValues);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            newCoreValues.forEach(value => upsertCoreValue(value));
            

            
            return ok(newCoreValues);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create core values'));
        }
    }
} 