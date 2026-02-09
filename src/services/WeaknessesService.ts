import { err, ok, Result } from "neverthrow";
import { EventAwareService } from "./EventAwareService";
import { userWeaknesses$, UserWeakness, WeaknessType, clearWeaknesses as clearWeaknessesModel } from "@src/models/UserWeakness";
import { DependencyService } from "@src/core/injection/DependencyService";
import { DataService } from "./DataService";
import { AuthService } from "./AuthService";
import { generateUUID } from "@src/utils/UUIDUtil";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { WeaknessesActionService, IWeakness } from "@src/actions/weaknesses/WeaknessesActionService.interface";
import { GenerateDataService } from "./GenerateDataService";
import { FetchWeaknessesAction } from "@src/actions/weaknesses/FetchWeaknessesAction";
import { GenerateWeaknessesAction } from "@src/actions/weaknesses/GenerateWeaknessesAction";
import {
    IWeaknessesService,
    WeaknessesOnUserAssessmentChangeAction
} from "@src/actions/weaknesses/WeaknessesOnUserAssessmentChangeAction";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";
import { user$ } from "@src/models/SessionModel";
import { singleton } from "tsyringe";

@singleton()
export class WeaknessesService extends EventAwareService implements IWeaknessesService, WeaknessesActionService {
    private readonly _dataService!: DataService;
    private readonly _generateDataService!: GenerateDataService;
    private readonly _authService!: AuthService;

    constructor() {
        super('WeaknessesService', []);
        this._dataService = this.addDependency(DataService);
        this._generateDataService = this.addDependency(GenerateDataService);
        this._authService = this.addDependency(AuthService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        try {
            // Initialize event subscriptions
            await this.initializeCustomSubscriptions();

            // Register actions with GenerateDataService
            // 1. FetchWeaknessesAction should trigger on AUTH changes
            this._generateDataService.registerActions(ChangeType.LOGIN, [
                new FetchWeaknessesAction(this)
            ]);
            
            // 2. GenerateWeaknessesAction should trigger on USER_PROFILE_GENERATE_SUMMARY changes
            this._generateDataService.registerActions(ChangeType.USER_PROFILE_GENERATE_SUMMARY, [
                new GenerateWeaknessesAction(this)
            ]);
            
            // 3. WeaknessesOnUserAssessmentChangeAction should trigger on USER_ASSESSMENT changes
            this._generateDataService.registerActions(ChangeType.USER_ASSESSMENT, [
                new WeaknessesOnUserAssessmentChangeAction(this)
            ]);

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {}

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    async fetchUserWeaknesses(userId: string): Promise<Result<UserWeakness[], Error>> {
        try {
            const result = await this._dataService.fetchData<UserWeakness>('user_weaknesses', {
                filter: [{ field: 'user_id', value: userId }]
            });
            
            if (result.isErr()) {
                return err(result.error);
            }

            const weaknesses = result.value;

            // Update the observable state with fetched weaknesses
            const weaknessesMap: { [id: string]: UserWeakness } = {};
            weaknesses.forEach((weakness: UserWeakness) => {
                weaknessesMap[weakness.id] = weakness;
            });
            userWeaknesses$.set(weaknessesMap);
            


            return ok(weaknesses);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async createWeakness(value: IWeakness, type: WeaknessType = WeaknessType.SYSTEM_GENERATED): Promise<Result<UserWeakness, Error>> {
        const userId = this.getUserId();
        if (!userId) {
            return err(new Error("No user ID found"));
        }

        // Create the weakness object
        const weakness: UserWeakness = {
            id: generateUUID(),
            user_id: userId,
            title: value.title,
            description: value.description,
            weakness_type: type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        try {
            // Validate weakness data
            // (assuming SchemaValidator validation logic)

            // Save to database
            const result = await this._dataService.upsertData<UserWeakness>('user_weaknesses', [weakness]);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            const weaknesses = userWeaknesses$.peek() || {};
            weaknesses[weakness.id] = weakness;
            userWeaknesses$.set(weaknesses);



            return ok(weakness);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async createWeaknesses(values: IWeakness[], type: WeaknessType = WeaknessType.SYSTEM_GENERATED): Promise<Result<UserWeakness[], Error>> {
        const userId = this.getUserId();
        if (!userId) {
            return err(new Error("No user ID found"));
        }

        try {
            const weaknesses: UserWeakness[] = values.map(value => ({
                id: generateUUID(),
                user_id: userId,
                title: value.title,
                description: value.description,
                weakness_type: type,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            // Save to database
            const result = await this._dataService.upsertData<UserWeakness>('user_weaknesses', weaknesses);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            const weaknessesMap: { [id: string]: UserWeakness } = {};
            weaknesses.forEach(weakness => {
                weaknessesMap[weakness.id] = weakness;
            });
            userWeaknesses$.set(weaknessesMap);



            return ok(weaknesses);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async updateWeakness(id: string, updates: Partial<IWeakness>): Promise<Result<UserWeakness, Error>> {
        const userId = this.getUserId();
        if (!userId) {
            return err(new Error("No user ID found"));
        }

        try {
            // Get current weaknesses
            const currentWeaknesses = userWeaknesses$.peek();
            if (!currentWeaknesses || !currentWeaknesses[id]) {
                return err(new Error(`Weakness with ID ${id} not found`));
            }

            // Update the weakness
            const updatedWeakness: UserWeakness = {
                ...currentWeaknesses[id],
                ...updates,
                updated_at: new Date().toISOString()
            };

            // Save to database
            const result = await this._dataService.upsertData<UserWeakness>('user_weaknesses', [updatedWeakness]);
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            currentWeaknesses[id] = updatedWeakness;
            userWeaknesses$.set(currentWeaknesses);



            return ok(updatedWeakness);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async deleteWeakness(id: string): Promise<Result<boolean, Error>> {
        const userId = this.getUserId();
        if (!userId) {
            return err(new Error("No user ID found"));
        }

        try {
            // Get current weaknesses
            const currentWeaknesses = userWeaknesses$.peek();
            if (!currentWeaknesses || !currentWeaknesses[id]) {
                return err(new Error(`Weakness with ID ${id} not found`));
            }

            // Delete from database
            const result = await this._dataService.deleteData('user_weaknesses', {
                filter: [{ field: 'id', value: id }]
            });
            if (result.isErr()) {
                return err(result.error);
            }

            // Update local state
            delete currentWeaknesses[id];
            userWeaknesses$.set({...currentWeaknesses});



            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    async clearWeaknesses(): Promise<Result<boolean, Error>> {
        const userId = this.getUserId();
        if (!userId) {
            return err(new Error("No user ID found"));
        }

        try {
            // Clear weaknesses from database
            const result = await this._dataService.deleteData('user_weaknesses', {
                filter: [{ field: 'user_id', value: userId }]
            });
            if (result.isErr()) {
                return err(result.error);
            }

            // Clear local state
            clearWeaknessesModel();
            


            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    private getUserId(): string | null {
        const currentUser = this._authService.currentUser$.peek();
        return currentUser?.id || null;
    }
} 