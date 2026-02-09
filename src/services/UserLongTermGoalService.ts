import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { DataService } from "./DataService";
import { UserLongTermGoal, userLongTermGoals$, upsertUserLongTermGoal, removeUserLongTermGoal, clearUserLongTermGoals } from "@src/models/UserLongTermGoal";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "@src/utils/UUIDUtil";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";
import { GenerateDataService } from "./GenerateDataService";
import { FetchUserLongTermGoalsAction } from "@src/actions/longTermGoals/FetchUserLongTermGoalsAction";
import { IUserLongTermGoalService } from "@src/actions/longTermGoals/IUserLongTermGoalService";

@singleton()
export class UserLongTermGoalService extends EventAwareService implements IUserLongTermGoalService {
    private readonly _dataService!: DataService;
    private readonly _generateDataService!: GenerateDataService;

    constructor() {
        super('UserLongTermGoalService', []);
        this._dataService = this.addDependency(DataService);
        this._generateDataService = this.addDependency(GenerateDataService);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
    }

    protected async onInitialize?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Register actions with GenerateDataService
        this._generateDataService.registerActions(ChangeType.LOGIN, [
            new FetchUserLongTermGoalsAction(this)
        ]);

        return ok(true);
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        // Subscribe to the observable for local state changes and sync with database
        this.onChange(userLongTermGoals$, async (change) => {
            try {
                const userId = user$.peek()?.id;
                if (!userId) {
                    console.error('Cannot sync goals - no user logged in');
                    return;
                }

                const newState = change.value;
                if (!newState) {
                    // Handle clearing of goals
                    await this._dataService.deleteData('user_long_term_goals', {
                        filter: [{ field: 'user_id', value: userId }]
                    });
                    return;
                }

                // Get current state from database
                const currentResult = await this._dataService.fetchData<UserLongTermGoal>('user_long_term_goals', {
                    filter: [{ field: 'user_id', value: userId }]
                });

                if (currentResult.isErr()) {
                    console.error('Failed to fetch current goals:', currentResult.error);
                    return;
                }

                const currentIds = new Set(currentResult.value.map(g => g.id));
                const newIds = new Set(Object.keys(newState));

                // Items to delete - in current but not in new
                const toDelete = currentResult.value.filter(g => !newIds.has(g.id));
                if (toDelete.length > 0) {
                    const deleteResult = await this._dataService.deleteData('user_long_term_goals', {
                        filter: [{ field: 'id', value: toDelete.map(g => g.id) }]
                    });
                    if (deleteResult.isErr()) {
                        console.error('Failed to delete goals:', deleteResult.error);
                    }
                }

                // Items to upsert - in new but not in current or updated
                const toUpsert = Object.values(newState).filter(g => 
                    !currentIds.has(g.id) || 
                    currentResult.value.find(cg => cg.id === g.id)?.goal !== g.goal
                );
                if (toUpsert.length > 0) {
                    const upsertResult = await this._dataService.upsertData('user_long_term_goals', toUpsert);
                    if (upsertResult.isErr()) {
                        console.error('Failed to upsert goals:', upsertResult.error);
                    }
                }
            } catch (error) {
                console.error('Error syncing goals with database:', error);
            }
        });
        return ok(true);
    }

    protected async onEnd?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    async fetchUserLongTermGoals(userId: string): Promise<Result<UserLongTermGoal[], Error>> {
        const result = await this._dataService.fetchData<UserLongTermGoal>('user_long_term_goals', {
            filter: [{ field: 'user_id', value: userId }]
        });

        if (result.isErr()) {
            return err(result.error);
        }

        // Update local state
        result.value.forEach(goal => {
            upsertUserLongTermGoal(goal);
        });

        return ok(result.value);
    }

    async createUserLongTermGoal(goal: string): Promise<Result<UserLongTermGoal, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const newGoal: UserLongTermGoal = {
            id: generateUUID(),
            user_id: userId,
            goal,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const result = await this._dataService.upsertData('user_long_term_goals', [newGoal]);
        if (result.isErr()) {
            return err(result.error);
        }

        // Update local state
        upsertUserLongTermGoal(newGoal);
        return ok(newGoal);
    }

    async updateUserLongTermGoal(goalId: string, goal: string): Promise<Result<UserLongTermGoal, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const currentGoals = userLongTermGoals$.peek();
        const existingGoal = currentGoals?.[goalId];
        if (!existingGoal) {
            return err(new Error('Goal not found'));
        }

        const updatedGoal: UserLongTermGoal = {
            ...existingGoal,
            goal,
            updated_at: new Date().toISOString()
        };

        const result = await this._dataService.upsertData('user_long_term_goals', [updatedGoal]);
        if (result.isErr()) {
            return err(result.error);
        }

        // Update local state
        upsertUserLongTermGoal(updatedGoal);
        return ok(updatedGoal);
    }

    async deleteUserLongTermGoal(goalId: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }

        const result = await this._dataService.deleteData('user_long_term_goals', {
            filter: [{ field: 'id', value: goalId }]
        });

        if (result.isErr()) {
            return err(result.error);
        }

        // Update local state
        removeUserLongTermGoal(goalId);
        return ok(true);
    }
} 