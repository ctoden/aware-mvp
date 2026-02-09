import { syncObservable } from "@legendapp/state/sync";
import { SUPABASE_CLIENT_KEY } from "@src/constants";
import { DependencyService } from "@src/core/injection/DependencyService";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { asyncStorageSync } from "@src/models/customSupabaseSync";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { initializeSupabaseClient } from "@src/utils/SupabaseClientUtil";
import { SupabaseClient } from "@supabase/supabase-js";
import { err, ok, Result } from "neverthrow";
import { singleton } from "tsyringe";
import { IDataProvider } from "./DataProvider";
import { SyncRegistration } from "./ISyncRegistry";
import { IData } from "@src/types/IData";

@singleton()
export class SupabaseDataProvider extends ObservableLifecycleManager implements IDataProvider {
    private static _instance: SupabaseDataProvider;
    protected _supabaseClient: SupabaseClient | null = null;
    protected _syncRegistry: SyncRegistration<any>[] = [];
    name = 'SupabaseDataProvider';

    constructor() {
        super();
        if (SupabaseDataProvider._instance) {
            return SupabaseDataProvider._instance;
        }
        this._supabaseClient = DependencyService.resolveSafe(SUPABASE_CLIENT_KEY);
        SupabaseDataProvider._instance = this;
    }

    get hasBeenInitialized(): boolean {
        return this.isInitialized.get();
    }

    // Register an observable for later sync
    public registerSync<T>(registration: SyncRegistration<T>): void {
        this._syncRegistry.push(registration);
    }

    protected get client(): SupabaseClient {
        if (!this._supabaseClient) {
            console.warn('Supabase client accessed before initialization');
            throw new Error('Supabase client is not initialized');
        }
        return this._supabaseClient;
    }

    // Add a safe client resolver that attempts to initialize
    protected async safeResolveClient(): Promise<Result<SupabaseClient, Error>> {
        if (this._supabaseClient) {
            return ok(this._supabaseClient);
        }
        
        return await initializeSupabaseClient();
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if (!this._supabaseClient) {
            const result = await initializeSupabaseClient();
            if (result.isErr()) {
                return err(result.error);
            }
            this._supabaseClient = result.value;
        }

        await this.setupSync();
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this._supabaseClient = null;
        return BR_TRUE;
    }

    protected async setupSync(): Promise<void> {
        for (const reg of this._syncRegistry) {
            syncObservable(reg.observable, asyncStorageSync()(
                reg.syncOptions
            ))
        }
    }

    async fetchData<T>(
        collection: string,
        query: {
            select?: string;
            filter?: { field: string; value: any }[];
        }
    ): Promise<Result<T[], Error>> {
        try {
            const clientResult = await this.safeResolveClient();
            if (clientResult.isErr()) {
                return err(clientResult.error);
            }
            
            const client = clientResult.value;
            let queryBuilder = client
                .from(collection)
                .select(query.select || '*');

            if (query.filter) {
                query.filter.forEach(({ field, value }) => {
                    queryBuilder = queryBuilder.eq(field, value);
                });
            }

            const { data, error } = await queryBuilder;

            if (error) {
                return err(new Error(error.message));
            }

            return ok(data as T[]);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }

    async updateData<T extends IData>(collection: string, data: T): Promise<Result<T, Error>> {
        try {
            const clientResult = await this.safeResolveClient();
            if (clientResult.isErr()) {
                return err(clientResult.error);
            }
            
            const client = clientResult.value;
            const { data: updatedData, error } = await client
                .from(collection)
                .update(data)
                .eq("id", data.id)
                .select()
                .single();

            if (error) {
                return err(new Error(error.message));
            }

            return ok(updatedData as T);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }

    async upsertData<T>(collection: string, data: T | T[]): Promise<Result<T[], Error>> {
        try {
            const clientResult = await this.safeResolveClient();
            if (clientResult.isErr()) {
                return err(clientResult.error);
            }
            
            const client = clientResult.value;
            
            // First attempt with returning data
            const { data: upsertedData, error } = await client
                .from(collection)
                .upsert(data)
                .select();

            // If we get an RLS error, try again with no returning clause
            if (error && error.code === '42501') {
                // Try again without returning data (using .select())
                const { error: minimalError } = await client
                    .from(collection)
                    .upsert(data);
                
                if (minimalError) {
                    return err(new Error(minimalError.message));
                }
                
                // Since we didn't get returned data, we'll try to fetch it if possible
                // This will only work for arrays of objects with IDs
                if (Array.isArray(data)) {
                    const dataArray = data as any[];
                    if (dataArray.length > 0 && 'id' in dataArray[0]) {
                        const ids = dataArray.map(item => item.id);
                        const { data: fetchedData, error: fetchError } = await client
                            .from(collection)
                            .select()
                            .in('id', ids);
                            
                        if (fetchError) {
                            return err(new Error(fetchError.message));
                        }
                        
                        return ok(fetchedData as T[]);
                    }
                } else if (typeof data === 'object' && data !== null && 'id' in (data as any)) {
                    // Handle single object case
                    const { data: fetchedData, error: fetchError } = await client
                        .from(collection)
                        .select()
                        .eq('id', (data as any).id);
                        
                    if (fetchError) {
                        return err(new Error(fetchError.message));
                    }
                    
                    return ok(fetchedData as T[]);
                }
                
                // If we can't fetch the updated data, return an empty array
                return ok([] as T[]);
            } else if (error) {
                return err(new Error(error.message));
            }

            return ok(upsertedData as T[]);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }

    async deleteData(
        collection: string,
        query: {
            filter?: { field: string; value: any }[];
        }
    ): Promise<Result<boolean, Error>> {
        try {
            const clientResult = await this.safeResolveClient();
            if (clientResult.isErr()) {
                return err(clientResult.error);
            }
            
            const client = clientResult.value;
            let queryBuilder = client.from(collection).delete();

            if (!query.filter || query.filter.length === 0) {
                return err(new Error('Filter is required for delete operations'));
            }

            query.filter.forEach(({ field, value }) => {
                queryBuilder = queryBuilder.eq(field, value);
            });

            const { error } = await queryBuilder;

            if (error) {
                return err(new Error(error.message));
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to delete data'));
        }
    }
} 