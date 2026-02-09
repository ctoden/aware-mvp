import { AppState, AppStateStatus, Platform } from 'react-native';
import { singleton } from 'tsyringe';
import { Result, err, ok } from 'neverthrow';
import { ObservableLifecycleManager } from '@src/core/lifecycle/ObservableLifecycleManager';
import { IAppStateProvider, AppStateChangeCallback } from './AppStateProvider';
import { BR_TRUE } from '@src/utils/NeverThrowUtils';
import { DependencyService } from '@src/core/injection/DependencyService';
import { SUPABASE_CLIENT_KEY } from '@src/constants';
import { SupabaseClient } from '@supabase/supabase-js';
import { initializeSupabaseClient } from '@src/utils/SupabaseClientUtil';
import { ChangeType, emitChange } from '@src/events/ChangeEvent';
import { user$ } from '@src/models/SessionModel';

@singleton()
export class ReactNativeAppStateProvider extends ObservableLifecycleManager implements IAppStateProvider {
    private static _instance: ReactNativeAppStateProvider;
    private _supabaseClient: SupabaseClient | null = null;
    name = 'ReactNativeAppStateProvider';

    constructor() {
        super();
        if (ReactNativeAppStateProvider._instance) {
            return ReactNativeAppStateProvider._instance;
        }
        ReactNativeAppStateProvider._instance = this;
    }

    protected async onInitialize?(): Promise<Result<boolean, Error>> {
        this._supabaseClient = DependencyService.resolveSafe(SUPABASE_CLIENT_KEY);
        if (!this._supabaseClient) {
            const result = await initializeSupabaseClient();
            if (result.isErr()) {
                return err(result.error);
            }
            this._supabaseClient = result.value;
        }
        return BR_TRUE;
    }

    protected async onEnd?(): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    private ensureProvider(): Result<SupabaseClient, Error> {
        if (!this._supabaseClient) {
            return err(new Error('Supabase client not initialized'));
        }
        return ok(this._supabaseClient);
    }

    getCurrentState(): AppStateStatus {
        return AppState.currentState;
    }

    onAppStateChange(callback: AppStateChangeCallback): { remove: () => void } {
        // Only handle auto-refresh on native platforms
        if (Platform.OS !== 'web') {
            const providerResult = this.ensureProvider();
            if (providerResult.isErr()) {
                throw providerResult.error;
            }
            const supabase = providerResult.value;

            const subscription = AppState.addEventListener('change', async (state) => {
                if (state === 'active') {
                    console.log("~~~ App returned to foreground - preserving user data and refreshing profile");
                    // Explicitly attempt to restore the session when app comes to foreground
                    const { data, error } = await supabase.auth.getSession();
                    if (data?.session) {
                        // If we have a session, ensure it's active
                        await supabase.auth.startAutoRefresh();
                        
                        // Force a profile refresh if user is logged in
                        const currentUser = user$.peek();
                        if (currentUser?.id) {
                            console.log("~~~ Forcing profile refresh after app returns to foreground");
                            // Emit USER_PROFILE_REFRESH to force reload data from database
                            emitChange(ChangeType.USER_PROFILE_REFRESH, { forceRefresh: true });
                        }
                    }
                } else {
                    await supabase.auth.stopAutoRefresh();
                }
                callback(state);
            });
            return subscription;
        }
        // Return no-op for web
        return { remove: () => {} };
    }
} 