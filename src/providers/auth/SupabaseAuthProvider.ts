import { SUPABASE_CLIENT_KEY } from "@src/constants";
import { DependencyService } from "@src/core/injection/DependencyService";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { initializeSupabaseClient } from "@src/utils/SupabaseClientUtil";
import { AuthError, Session, SupabaseClient } from "@supabase/supabase-js";
import { err, ok, Result } from "neverthrow";
import { singleton } from "tsyringe";
import { AuthResponseData, AuthSession, AuthStateChangeCallback, IAuthProvider } from "./AuthProvider";
import { SignUpData } from "@src/types/SignUpData";
import { userProfile$ } from "@src/models/UserProfile";
import { UserProfileService } from "@src/services/UserProfileService";

function mapSession(session: Session | null): AuthSession | null {
    if (!session) return null;
    return {
        access_token: session.access_token,
        user: session.user ? {
            id: session.user.id,
            email: session.user.email ?? undefined
        } : null
    };
}

function mapAuthResponse(data: { user: any, session: Session | null }): AuthResponseData {
    return {
        user: data.user ? {
            id: data.user.id,
            email: data.user.email
        } : null,
        session: mapSession(data.session)
    };
}

@singleton()
export class SupabaseAuthProvider extends ObservableLifecycleManager implements IAuthProvider {
    private static _instance: SupabaseAuthProvider;
    protected _supabaseClient: SupabaseClient | null = null;
    name = 'SupabaseAuthProvider';

    constructor() {
        super();
        if (SupabaseAuthProvider._instance) {
            return SupabaseAuthProvider._instance;
        }
        this._supabaseClient = DependencyService.resolveSafe(SUPABASE_CLIENT_KEY);
        SupabaseAuthProvider._instance = this;
    }

    static getInstance(): SupabaseAuthProvider {
        if (!SupabaseAuthProvider._instance) {
            SupabaseAuthProvider._instance = new SupabaseAuthProvider();
        }
        return SupabaseAuthProvider._instance;
    }

    protected get client(): SupabaseClient {
        if (!this._supabaseClient) {
            console.warn('Supabase client accessed before initialization in auth provider');
            throw new Error('Supabase client is not initialized');
        }
        return this._supabaseClient;
    }

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
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        void this.signOut();
        this._supabaseClient = null;
        return BR_TRUE;
    }

    async signUp(email: string, password: string, userData: SignUpData): Promise<Result<AuthResponseData, AuthError>> {
        try {
            const {data, error} = await this.client.auth.signUp({
                email, 
                password
            });
            if (error) {
                return err(error as AuthError);
            }

            // Wait for profile to be created by backend
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create initial profile
            if (data.user) {
                userProfile$.set({
                    id: data.user.id,
                    full_name: userData.fullName,
                    phone_number: userData.phoneNumber,
                    avatar_url: null,
                    summary: null,
                    updated_at: new Date().toISOString(),
                    website: null,
                    family_story: null,
                    primary_occupation: null,
                    birth_date: null,
                    has_completed_intro: false,
                    has_completed_ftux: false,
                    ftux_current_step: 0
                });
            }

            return ok(mapAuthResponse(data));
        } catch (error) {
            return err(error as AuthError);
        }
    }

    async signIn(email: string, password: string): Promise<Result<AuthResponseData, AuthError>> {
        try {
            const clientResult = await this.safeResolveClient();
            if (clientResult.isErr()) {
                return err(clientResult.error as AuthError);
            }
            
            const client = clientResult.value;
            const {data, error} = await client.auth.signInWithPassword({email, password});
            if (error) {
                return err(error as AuthError);
            }
            return ok(mapAuthResponse(data));
        } catch (error) {
            return err(error as AuthError);
        }
    }

    async signOut(): Promise<Result<boolean, AuthError>> {
        try {
            const clientResult = await this.safeResolveClient();
            if (clientResult.isErr()) {
                return err(clientResult.error as AuthError);
            }
            
            const client = clientResult.value;
            const {error} = await client.auth.signOut();
            if (error) {
                return err(error as AuthError);
            }
            return ok(true);
        } catch (error) {
            return err(error as AuthError);
        }
    }

    async startAutoRefresh(): Promise<void> {
        return this.client.auth.startAutoRefresh();
    }

    async stopAutoRefresh(): Promise<void> {
        return this.client.auth.stopAutoRefresh();
    }

    onAuthStateChange(callback: AuthStateChangeCallback): { data: { subscription: { unsubscribe: () => void } } } {
        return this.client.auth.onAuthStateChange((_, session) => {
            console.log("~~~ SupabaseAuthProvider onAuthStateChange: ", session);
            callback(mapSession(session));
        });
    }

    getSession(): Promise<Result<AuthSession | null, AuthError>> {
        return this.client.auth.getSession()
            .then(({data}) => ok(mapSession(data.session)))
            .catch(error => err(error as AuthError));
    }
} 