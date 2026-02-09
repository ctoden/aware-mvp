import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { LifeCycleConfig } from "../core/lifecycle/LifeCycleManager";
import { DataService } from "./DataService";
import { 
    UserMainInterest, 
    UserMainInterestCreate,
    userMainInterests$, 
    upsertUserMainInterest, 
    clearUserMainInterests 
} from "../models/UserMainInterest";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "../utils/UUIDUtil";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";

@singleton()
export class UserMainInterestService extends EventAwareService {
    private readonly _dataService!: DataService;

    constructor() {
        super('UserMainInterestService', [
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
        userMainInterests$.set(null);
        return ok(true);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
        if (event.type === ChangeType.LOGIN) {
            const session = event.payload;
            if (session?.user) {
                const result = await this.fetchUserMainInterests(session.user.id);
                if (result.isOk()) {
                    userMainInterests$.set(result.value.reduce((acc, value) => {
                        acc[value.id] = value;
                        return acc;
                    }, {} as Record<string, UserMainInterest>));
                }
            }
        }
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        // Subscribe to the observable for local state changes and sync with database
        this.onChange(userMainInterests$, async (change) => {
            try {
                const userId = user$.peek()?.id;
                if (!userId) {
                    console.error('Cannot sync interests - no user logged in');
                    return;
                }

                const newState = change.value;
                if (!newState) {
                    // Handle clearing of interests
                    await this._dataService.deleteData('user_main_interests', {
                        filter: [{ field: 'user_id', value: userId }]
                    });
                    return;
                }

                // Get current state from database
                const currentResult = await this._dataService.fetchData<UserMainInterest>('user_main_interests', {
                    filter: [{ field: 'user_id', value: userId }]
                });

                if (currentResult.isErr()) {
                    console.error('Failed to fetch current interests:', currentResult.error);
                    return;
                }

                const currentIds = new Set(currentResult.value.map(i => i.id));
                const newIds = new Set(Object.keys(newState));

                // Items to delete - in current but not in new
                const toDelete = currentResult.value.filter(i => !newIds.has(i.id));
                if (toDelete.length > 0) {
                    const deleteResult = await this._dataService.deleteData('user_main_interests', {
                        filter: [{ field: 'id', value: toDelete.map(i => i.id) }]
                    });
                    if (deleteResult.isErr()) {
                        console.error('Failed to delete interests:', deleteResult.error);
                    }
                }

                // Items to upsert - in new but not in current or updated
                const toUpsert = Object.values(newState).filter(i => 
                    !currentIds.has(i.id) || 
                    currentResult.value.find(ci => ci.id === i.id)?.interest !== i.interest
                );
                if (toUpsert.length > 0) {
                    const upsertResult = await this._dataService.upsertData('user_main_interests', toUpsert);
                    if (upsertResult.isErr()) {
                        console.error('Failed to upsert interests:', upsertResult.error);
                    }
                }
            } catch (error) {
                console.error('Error syncing interests with database:', error);
            }
        });
        return ok(true);
    }

    async fetchUserMainInterests(userId: string): Promise<Result<UserMainInterest[], Error>> {
        try {
            const result = await this._dataService.fetchData<UserMainInterest>('user_main_interests', {
                filter: [{ field: 'user_id', value: userId }]
            });
            
            if (result.isErr()) {
                return err(result.error);
            }
            
            // Update the observable state
            const valuesMap = result.value.reduce((acc, value) => {
                acc[value.id] = value;
                return acc;
            }, {} as Record<string, UserMainInterest>);
            userMainInterests$.set(valuesMap);
            

            
            return ok(result.value);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to fetch user main interests'));
        }
    }

    async createUserMainInterest(value: UserMainInterestCreate): Promise<Result<UserMainInterest, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        
        const newInterest: UserMainInterest = {
            id: generateUUID(),
            user_id: userId,
            interest: value.interest,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        try {
            const result = await this._dataService.upsertData<UserMainInterest>('user_main_interests', [newInterest]);
            if (result.isErr()) {
                return err(result.error);
            }
            
            // Update local state
            upsertUserMainInterest(newInterest);
            

            
            return ok(newInterest);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to create user main interest'));
        }
    }

    async deleteUserMainInterest(id: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        
        try {
            const result = await this._dataService.deleteData('user_main_interests', {
                filter: [
                    { field: 'id', value: id },
                    { field: 'user_id', value: userId }
                ]
            });
            
            if (result.isErr()) {
                return err(result.error);
            }
            
            // Update local state
            const values = userMainInterests$.peek();
            if (values && values[id]) {
                const newValues = { ...values };
                delete newValues[id];
                userMainInterests$.set(newValues);
                

            }
            
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to delete user main interest'));
        }
    }
    
    async clearUserMainInterests(): Promise<Result<boolean, Error>> {
        // Clear existing main interests
        clearUserMainInterests();
        

        
        return ok(true);
    }
} 