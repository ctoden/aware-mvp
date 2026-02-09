import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { DataService } from "./DataService";
import { UserShortTermGoal, userShortTermGoals$, upsertUserShortTermGoal, removeUserShortTermGoal, clearUserShortTermGoals } from "@src/models/UserShortTermGoal";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "@src/utils/UUIDUtil";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";

@singleton()
export class UserShortTermGoalService extends EventAwareService {
    private readonly _dataService!: DataService;

    constructor() {
        super('UserShortTermGoalService', [
            ChangeType.LOGIN  // Only listen for user session changes
        ]);
        this._dataService = this.addDependency(DataService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        try {
            await this.initializeCustomSubscriptions();
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
        if (event.type === ChangeType.LOGIN) {
            const session = event.payload;
            if (session?.user) {
                const goalsResult = await this.fetchUserShortTermGoals(session.user.id);
                if (goalsResult.isErr()) {
                    console.error('Failed to fetch short term goals:', goalsResult.error);
                }
            }
        }
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        // Subscribe to the observable for local state changes and sync with database
        this.onChange(userShortTermGoals$, async (change) => {
            try {
                const userId = user$.peek()?.id;
                if (!userId) {
                    console.error('Cannot sync goals - no user logged in');
                    return;
                }

                const newState = change.value;
                if (!newState) {
                    // Handle clearing of goals
                    await this._dataService.deleteData('user_short_term_goals', {
                        filter: [{ field: 'user_id', value: userId }]
                    });
                    return;
                }

                // Get current state from database
                const currentResult = await this._dataService.fetchData<UserShortTermGoal>('user_short_term_goals', {
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
                    const deleteResult = await this._dataService.deleteData('user_short_term_goals', {
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
                    const upsertResult = await this._dataService.upsertData('user_short_term_goals', toUpsert);
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

    async fetchUserShortTermGoals(userId: string): Promise<Result<UserShortTermGoal[], Error>> {
        const result = await this._dataService.fetchData<UserShortTermGoal>('user_short_term_goals', {
            filter: [{ field: 'user_id', value: userId }]
        });
        if (result.isErr()) {
            return err(result.error);
        }
        const valuesMap = result.value.reduce((acc, value) => {
            acc[value.id] = value;
            return acc;
        }, {} as Record<string, UserShortTermGoal>);
        userShortTermGoals$.set(valuesMap);
        

        
        return ok(result.value);
    }

    async createUserShortTermGoal(goal: string): Promise<Result<UserShortTermGoal, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const newGoal: UserShortTermGoal = {
            id: generateUUID(),
            user_id: userId,
            goal,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        const result = await this._dataService.upsertData<UserShortTermGoal>('user_short_term_goals', [newGoal]);
        if (result.isErr()) {
            return err(result.error);
        }
        upsertUserShortTermGoal(newGoal);
        

        
        return ok(newGoal);
    }

    async updateUserShortTermGoal(id: string, goal: string): Promise<Result<UserShortTermGoal, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const currentValues = userShortTermGoals$.peek();
        const existingGoal = currentValues?.[id];
        if (!existingGoal) {
            return err(new Error('Goal not found'));
        }
        const updatedGoal: UserShortTermGoal = {
            ...existingGoal,
            goal,
            updated_at: new Date().toISOString()
        };
        const result = await this._dataService.updateData<UserShortTermGoal>('user_short_term_goals', updatedGoal);
        if (result.isErr()) {
            return err(result.error);
        }
        upsertUserShortTermGoal(updatedGoal);
        

        
        return ok(updatedGoal);
    }

    async deleteUserShortTermGoal(id: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const result = await this._dataService.deleteData('user_short_term_goals', {
            filter: [
                { field: 'id', value: id },
                { field: 'user_id', value: userId }
            ]
        });
        if (result.isErr()) {
            return err(result.error);
        }
        removeUserShortTermGoal(id);
        

        
        return ok(true);
    }
} 