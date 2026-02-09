import {AuthError} from "@supabase/supabase-js";
import {err, ok, Result} from "neverthrow";
import {singleton} from "tsyringe";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {AUTH_PROVIDER_KEY, AuthResponseData, IAuthProvider, AuthSession } from "@src/providers/auth/AuthProvider";
import {session$, user$, isAuthenticated$} from "@src/models/SessionModel";
import {DependencyService} from "@src/core/injection/DependencyService";
import { UserModel } from "@src/models/UserModel";
import { Observable } from "@legendapp/state";
import { SignUpData } from "@src/types/SignUpData";
import { EventAwareService } from "./EventAwareService";
import { ChangeEvent, ChangeType, emitChange } from "@src/events/ChangeEvent";
import { NavigateToAuthOnLogoutAction } from "@src/actions/navigation/NavigateToAuthOnLogoutAction";
import { ClearLocalStorageOnLogoutAction } from "@src/actions/navigation/ClearLocalStorageOnLogoutAction";
import { GenerateDataService } from "./GenerateDataService";
import { LocalStorageService } from "@src/services/LocalStorageService";
import { userProfile$ } from "@src/models/UserProfile";
import { userAssessments$ } from "@src/models/UserAssessment";
import { userAboutYou$ } from "@src/models/UserAboutYou";
import { familyStory$ } from "@src/models/FamilyStoryModel";
import { careerHistory$ } from "@src/models/CareerHistoryModel";
import { userInterests$ } from "@src/models/UserInterests";
import { userGoals$ } from "@src/models/UserGoals";
import { userRelationships$ } from "@src/models/UserRelationship";
import { safelyClearObservables } from "@src/utils/ObservableUtils";

@singleton()
export class AuthService extends EventAwareService {
    private static _instance: AuthService;
    private _authProvider: IAuthProvider | null = null;
    private _generateDataService!: GenerateDataService;

    // Track when the last LOGIN/LOGOUT events occurred to prevent duplicates
    private lastLoginTime: number = 0;
    private lastLogoutTime: number = 0;
    private readonly AUTO_REFRESH_DEBOUNCE_TIME = 2000; // 2 seconds

    private isLoggedIn = false;

    constructor() {
        super('AuthService', []);
        if (AuthService._instance) {
            return AuthService._instance;
        }
        this._generateDataService = DependencyService.resolve(GenerateDataService);
        AuthService._instance = this;
    }

    static getInstance(): AuthService {
        if (!AuthService._instance) {
            AuthService._instance = new AuthService();
        }
        return AuthService._instance;
    }

    get currentUser$(): Observable<UserModel | null> {
        return user$;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Get the auth provider
        this._authProvider = DependencyService.resolveSafe(AUTH_PROVIDER_KEY);
        if (!this._authProvider) {
            return err(new Error('No auth provider registered'));
        }

        // Register actions to respond to LOGOUT events
        console.log("~~~ AuthService: Registering actions for LOGOUT events");
        this._generateDataService.registerActions(ChangeType.LOGOUT, [
            new NavigateToAuthOnLogoutAction(),
            new ClearLocalStorageOnLogoutAction()
        ]);

        return ok(true);
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
        // Currently this service only emits events, it doesn't react to any
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        console.log("~~~ AuthService: Initializing custom subscriptions");
        // Subscribe to auth changes
        const { data: { subscription } } = this._authProvider!.onAuthStateChange((session) => {
            console.log("~~~ AuthService: Auth state changed", session);
            const now = Date.now();
            
            if(!session) {
                if(!session$.peek()) {
                    return;
                }
                console.log("~~~ AuthService: Session cleared");
                session$.set(null);
                user$.set(null);
                
                // Emit LOGOUT event only if it hasn't been emitted recently
                if (now - this.lastLogoutTime > this.AUTO_REFRESH_DEBOUNCE_TIME) {
                    this.isLoggedIn = false;
                    console.log("~~~ AuthService: Emitting LOGOUT event from auto-refresh");
                    emitChange(ChangeType.LOGOUT, { preserveUserData: true }, 'system');
                    this.lastLogoutTime = now;
                }
                
                // Emit AUTH change with preserveUserData flag
                emitChange(ChangeType.AUTH, { preserveUserData: true });
                return;
            }
            
            const sessionData = {
                access_token: session.access_token,
                refresh_token: undefined,
                expires_in: undefined,
                expires_at: undefined,
                token_type: 'bearer',
                provider_token: undefined,
                provider_refresh_token: undefined,
                user: session.user ? {
                    id: session.user.id,
                    app_metadata: {},
                    user_metadata: {},
                    aud: 'authenticated',
                    created_at: new Date().toISOString(),
                    email: session.user.email,
                } : null
            };
            
            session$.set(sessionData);
            
            if (sessionData.user) {
                if(this.isLoggedIn) {
                    console.log("~~~ AuthService: User already logged in, skipping");
                    return;
                }
                const isNewLogin = !user$.peek() || user$.peek()?.id !== sessionData.user.id;
                user$.set(sessionData.user);
                
                // Construct payload with user data
                const payload = {
                    ...sessionData.user,
                    preserveUserData: true  // Add flag to preserve data on session restoration
                };
                
                // Emit LOGIN event only if it hasn't been emitted recently and this is a restored session
                if ((isNewLogin || now - this.lastLoginTime > this.AUTO_REFRESH_DEBOUNCE_TIME)) {
                    this.isLoggedIn = true;
                    setTimeout(() => {
                        console.log("~~~ AuthService: Emitting LOGIN event from auto-refresh");
                        emitChange(ChangeType.LOGIN, payload, 'system');
                    }, 100);
                    this.lastLoginTime = now;
                }
                
                // Emit AUTH change event with preserveUserData flag
                emitChange(ChangeType.AUTH, payload);
            } else {
                user$.set(null);
                // Emit AUTH change with preserveUserData flag when user is null
                emitChange(ChangeType.AUTH, { preserveUserData: true });
            }
        });
        this.observableSubscriptions.push(subscription.unsubscribe);

        return ok(true);
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if (!this._authProvider) {
            return ok(true);
        }
        return this._authProvider.end();
    }

    private ensureProvider(): Result<IAuthProvider, Error> {
        if (!this._authProvider) {
            return err(new Error('Auth provider not initialized'));
        }
        return ok(this._authProvider);
    }

    async signUp(
        email: string, 
        password: string, 
        userData: SignUpData
    ): Promise<Result<AuthResponseData, AuthError>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error as AuthError);
        }
        const result = await providerResult.value.signUp(email, password, userData);
        
        // Emit SIGNUP event on success
        if (result.isOk()) {
            console.log('~~~ AuthService: Emitting SIGNUP event');
            emitChange(ChangeType.SIGNUP, result.value, 'user_action');
        }
        
        return result;
    }

    async signIn(email: string, password: string): Promise<Result<AuthResponseData, AuthError>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(new AuthError(providerResult.error.message));
        }
        const result = await providerResult.value.signIn(email, password);
        
        // Emit LOGIN event on success
        if (result.isOk()) {
            this.isLoggedIn = true;
            console.log('~~~ AuthService: Emitting LOGIN event');
            emitChange(ChangeType.LOGIN, result.value, 'user_action');
            this.lastLoginTime = Date.now();
        }
        
        return result;
    }

    async signOut(preserveUserData: boolean = false): Promise<Result<boolean, AuthError>> {
        console.log("~~~ AuthService: Executing comprehensive logout");
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(new AuthError(providerResult.error.message));
        }

        try {
            // Get necessary services for cleanup
            const localStorageService = DependencyService.resolve(LocalStorageService);

            // 1. Clear AsyncStorage if requested
            if (!preserveUserData && localStorageService) {
                await localStorageService.clear();
            }

            // 2. Clear all observable state with type-safe values
            if (!preserveUserData) {
                // Clear all app state when fully logging out
                safelyClearObservables([
                    { observable: session$, defaultValue: null, label: 'session$' },
                    { observable: user$, defaultValue: null, label: 'user$' },
                    { observable: isAuthenticated$, defaultValue: false, label: 'isAuthenticated$' },
                    { observable: userProfile$, defaultValue: null, label: 'userProfile$' },
                    { observable: userAssessments$, defaultValue: [], label: 'userAssessments$' },
                    { observable: userAboutYou$, defaultValue: null, label: 'userAboutYou$' },
                    { observable: familyStory$, defaultValue: { story: '' }, label: 'familyStory$' },
                    { observable: careerHistory$, defaultValue: [], label: 'careerHistory$' },
                    { observable: userInterests$, defaultValue: null, label: 'userInterests$' },
                    { observable: userGoals$, defaultValue: null, label: 'userGoals$' },
                    { observable: userRelationships$, defaultValue: null, label: 'userRelationships$' }
                ]);
            } else {
                // Always clear auth-related observables even when preserving data
                safelyClearObservables([
                    { observable: session$, defaultValue: null, label: 'session$' },
                    { observable: user$, defaultValue: null, label: 'user$' },
                    { observable: isAuthenticated$, defaultValue: false, label: 'isAuthenticated$' }
                ]);
            }

            // 3. Perform the actual auth logout
            const result = await providerResult.value.signOut();
            if (result.isErr()) {
                return err(result.error);
            }

            // 4. Set login state
            this.isLoggedIn = false;
            
            // 5. Emit LOGOUT event with preserve flag
            console.log('~~~ AuthService: Emitting LOGOUT event');
            emitChange(ChangeType.LOGOUT, { preserveUserData }, 'user_action');
            this.lastLogoutTime = Date.now();

            return result;
        } catch (error) {
            console.error('~~~ AuthService: Error during logout:', error);
            return err(error instanceof AuthError ? error : new AuthError((error as Error).message));
        }
    }

    async startAutoRefresh(): Promise<void> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            throw new Error(providerResult.error.message);
        }
        return providerResult.value.startAutoRefresh();
    }

    async stopAutoRefresh(): Promise<void> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            throw new Error(providerResult.error.message);
        }
        return providerResult.value.stopAutoRefresh();
    }

    async getSession(): Promise<Result<AuthResponseData | null, AuthError>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(new AuthError(providerResult.error.message));
        }

        try {
            const result = await providerResult.value.getSession();
            if (result.isErr()) {
                return err(result.error);
            }
            const session = result.value;
            if (!session) {
                return ok(null);
            }
            return ok({
                user: session.user,
                session
            });
        } catch (error) {
            return err(error as AuthError);
        }
    }

    addAuthStateChangeHandler(callback: (session: AuthSession | null) => void){
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            throw new Error(providerResult.error.message);
        }
        return providerResult.value.onAuthStateChange(callback);
    }

    /**
     * Checks if a user is currently authenticated
     * @returns A promise that resolves to a boolean indicating whether the user is authenticated
     */
    async isAuthenticated(): Promise<boolean> {
        const sessionResult = await this.getSession();
        return sessionResult.isOk() && sessionResult.value !== null && !!sessionResult.value.user;
    }
}