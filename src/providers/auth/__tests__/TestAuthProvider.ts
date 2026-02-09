import {AuthError} from "@supabase/supabase-js";
import {err, ok, Result} from "neverthrow";
import {singleton} from "tsyringe";
import {AuthResponseData, AuthSession, AuthStateChangeCallback, IAuthProvider} from "../AuthProvider";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";
import {ObservableLifecycleManager} from "@src/core/lifecycle/ObservableLifecycleManager";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {SignUpData} from "@src/types/SignUpData";
import { userProfile$ } from "@src/models/UserProfile";

@singleton()
export class TestAuthProvider extends ObservableLifecycleManager implements IAuthProvider {
    private static _instance: TestAuthProvider;
    private currentSession: AuthSession | null = null;
    private autoRefreshEnabled = false;
    private callbacks: AuthStateChangeCallback[] = [];
    name = 'TestAuthProvider';

    constructor() {
        super();
        if (TestAuthProvider._instance) {
            return TestAuthProvider._instance;
        }
        TestAuthProvider._instance = this;
    }

    static getInstance(): TestAuthProvider {
        if (!TestAuthProvider._instance) {
            TestAuthProvider._instance = new TestAuthProvider();
        }
        return TestAuthProvider._instance;
    }

    // Test helper methods
    setSession(session: AuthSession | null) {
        this.currentSession = session;
        this.notifyCallbacks();
    }
    
    // For convenience in tests
    isUserAuthenticated(): boolean {
        return this.currentSession !== null;
    }

    private notifyCallbacks() {
        this.callbacks.forEach(callback => callback(this.currentSession));
    }

    // IAuthProvider implementation
    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.currentSession = null;
        this.callbacks = [];
        return BR_TRUE;
    }

    async signUp(email: string, password: string, userData: SignUpData): Promise<Result<AuthResponseData, AuthError>> {
        if (email === "error@test.com") {
            return err(new AuthError("Test error"));
        }

        const session: AuthSession = {
            access_token: "test_token",
            user: {
                id: "test_user_id",
                email,
            }
        };

        this.currentSession = session;
        this.notifyCallbacks();

        const existingProfile = userProfile$.peek();
        userProfile$.set({
            id: "test_user_id",
            full_name: userData.fullName,
            phone_number: userData.phoneNumber,
            avatar_url: existingProfile?.avatar_url ?? null,
            summary: existingProfile?.summary ?? null,
            updated_at: new Date().toISOString(),
            website: existingProfile?.website ?? null
        });

        return ok({
            user: session.user,
            session
        });
    }

    async signIn(email: string, password: string): Promise<Result<AuthResponseData, AuthError>> {
        if (email === "error@test.com") {
            return err(new AuthError("Test error"));
        }

        const session: AuthSession = {
            access_token: "test_token",
            user: {
                id: "test_user_id",
                email
            }
        };

        this.currentSession = session;
        this.notifyCallbacks();

        return ok({
            user: session.user,
            session
        });
    }

    async signOut(): Promise<Result<boolean, AuthError>> {
        if (!this.currentSession) {
            return err(new AuthError("Not signed in"));
        }

        this.currentSession = null;
        this.notifyCallbacks();
        return ok(true);
    }

    async startAutoRefresh(): Promise<void> {
        this.autoRefreshEnabled = true;
    }

    async stopAutoRefresh(): Promise<void> {
        this.autoRefreshEnabled = false;
    }

    onAuthStateChange(callback: AuthStateChangeCallback): { data: { subscription: { unsubscribe: () => void } } } {
        this.callbacks.push(callback);
        return {
            data: {
                subscription: {
                    unsubscribe: () => {
                        this.callbacks = this.callbacks.filter(cb => cb !== callback);
                    }
                }
            }
        };
    }

    getSession(): Promise<Result<AuthSession | null, AuthError>> {
        return Promise.resolve(ok(this.currentSession));
    }
} 