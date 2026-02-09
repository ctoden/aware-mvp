import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { SupabaseClient } from "@supabase/supabase-js";
import { DependencyService } from "@src/core/injection/DependencyService";
import { SUPABASE_CLIENT_KEY } from "@src/constants";
import { IRemoteFunctionProvider } from "./RemoteFunctionProvider";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { initializeSupabaseClient } from "@src/utils/SupabaseClientUtil";

@singleton()
export class SupabaseRemoteFunctionProvider extends ObservableLifecycleManager implements IRemoteFunctionProvider {
    private static _instance: SupabaseRemoteFunctionProvider;
    protected _supabaseClient: SupabaseClient | null = null;
    name = 'SupabaseRemoteFunctionProvider';

    constructor() {
        super();
        if (SupabaseRemoteFunctionProvider._instance) {
            return SupabaseRemoteFunctionProvider._instance;
        }
        this._supabaseClient = DependencyService.resolveSafe(SUPABASE_CLIENT_KEY);
        SupabaseRemoteFunctionProvider._instance = this;
    }

    static getInstance(): SupabaseRemoteFunctionProvider {
        if (!SupabaseRemoteFunctionProvider._instance) {
            SupabaseRemoteFunctionProvider._instance = new SupabaseRemoteFunctionProvider();
        }
        return SupabaseRemoteFunctionProvider._instance;
    }

    protected get client(): SupabaseClient {
        if (!this._supabaseClient) {
            throw new Error('Supabase client is not initialized');
        }
        return this._supabaseClient;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if (!this._supabaseClient) {
            const result = await initializeSupabaseClient();
            if (result.isErr()) {
                return err(result.error);
            }
            this._supabaseClient = result.value;
        }
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this._supabaseClient = null;
        return BR_TRUE;
    }

    async invoke<T = any>(functionName: string, args?: Record<string, any>): Promise<Result<T, Error>> {
        try {
            const { data, error } = await this.client.functions.invoke<T>(functionName, {
                body: args
            });

            if (error) {
                return err(new Error(error.message));
            }

            if (data === null) {
                return err(new Error('Function returned null response'));
            }

            return ok(data);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to invoke remote function'));
        }
    }
} 