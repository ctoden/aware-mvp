import { DependencyService } from "@src/core/injection/DependencyService";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { userAssessments$ } from "@src/models/UserAssessment";
import { userCoreValues$ } from "@src/models/UserCoreValue";
import { userProfile$ } from "@src/models/UserProfile";
import { userTopQualities$ } from "@src/models/UserTopQuality";
import { APP_STATE_PROVIDER_KEY } from '@src/providers/appstate/AppStateProvider';
import { ReactNativeAppStateProvider } from '@src/providers/appstate/ReactNativeAppStateProvider';
import { AUTH_PROVIDER_KEY } from "@src/providers/auth/AuthProvider";
import { SupabaseAuthProvider } from "@src/providers/auth/SupabaseAuthProvider";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { SupabaseDataProvider } from "@src/providers/data/SupabaseDataProvider";
import { REMOTE_FUNCTION_PROVIDER_KEY } from "@src/providers/functions/RemoteFunctionProvider";
import { SupabaseRemoteFunctionProvider } from "@src/providers/functions/SupabaseRemoteFunctionProvider";
import { ILlmProvider, LLM_PROVIDER_KEY, LlmMessage } from "@src/providers/llm/LlmProvider";
import { MistralLlmProvider } from "@src/providers/llm/MistralLlmProvider";
import { AsyncStorageProvider } from "@src/providers/storage/AsyncStorageProvider";
import { STORAGE_PROVIDER_KEY } from "@src/providers/storage/StorageProvider";
import { AppStateService } from "@src/services/AppStateService";
import { err, ok, Result } from "neverthrow";
import { singleton } from "tsyringe";
import { AuthService } from "./AuthService";
import { DataService } from "./DataService";
import { LlmService } from "./LlmService";
import { RemoteFunctionService } from "./RemoteFunctionService";
import { Service } from "./Service";
import { UserAssessmentService } from "./UserAssessmentService";
import { UserProfileService } from "./UserProfileService";

import { ChangeType, emitChange } from "@src/events/ChangeEvent";
import { FtuxModel } from "@src/models/FtuxModel";
import { AssessmentHandlerRegistry } from "@src/providers/assessment/AssessmentHandlerRegistry";
import { BigFiveAssessmentHandler } from "@src/providers/assessment/handlers/BigFiveAssessmentHandler";
import { CliftonStrengthsAssessmentHandler } from "@src/providers/assessment/handlers/CliftonStrengthsAssessmentHandler";
import { DiscAssessmentHandler } from "@src/providers/assessment/handlers/DiscAssessmentHandler";
import { EnneagramAssessmentHandler } from "@src/providers/assessment/handlers/EnneagramAssessmentHandler";
import { LoveLanguagesAssessmentHandler } from "@src/providers/assessment/handlers/LoveLanguagesAssessmentHandler";
import { MBTIAssessmentHandler } from "@src/providers/assessment/handlers/MBTIAssessmentHandler";
import { MotivationCodeAssessmentHandler } from "@src/providers/assessment/handlers/MotivationCodeAssessmentHandler";
import { OpenAiLlmProvider } from "@src/providers/llm/OpenAiLlmProvider";
import { GenerateDataService } from "@src/services/GenerateDataService";
import { configureAppInitChangeTypes } from "@src/utils/ChangeEventUtils";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { AboutYouService } from "./AboutYouService";
import { CareerHistoryService } from "./CareerHistoryService";
import { ChatService } from "./ChatService";
import { CoreValuesService } from "./CoreValuesService";
import { DigDeeperService } from "./DigDeeperService";
import { FtuxService } from "./FtuxService";
import { getUserContextFromModels, LlmMessageBuilderService } from "./LlmMessageBuilderService";
import { MotivationsService } from "./MotivationsService";
import { ProfessionalDevelopmentService } from "./ProfessionalDevelopmentService";
import { TopQualitiesService } from "./TopQualitiesService";
import { UserInnerCircleService } from "./UserInnerCircleService";
import { UserLongTermGoalService } from "./UserLongTermGoalService";
import { UserMainInterestService } from "./UserMainInterestService";
import { UserQuickInsightService } from "./UserQuickInsightService";
import { UserRelationshipsService } from "./UserRelationshipsService";
import { UserShortTermGoalService } from "./UserShortTermGoalService";
import { WeaknessesService } from "./WeaknessesService";

@singleton()
export class AppInitializationService extends Service {
    private readonly _authService: AuthService;
    private readonly _dataService: DataService;
    private readonly _userProfileService: UserProfileService;
    private readonly _userAssessmentService: UserAssessmentService;
    private readonly _remoteFunctionService: RemoteFunctionService;
    private readonly _supabaseAuthProvider: SupabaseAuthProvider;
    private readonly _supabaseDataProvider: SupabaseDataProvider;
    private readonly _supabaseRemoteFunctionProvider: SupabaseRemoteFunctionProvider;
    private readonly _reactNativeAppStateProvider: ReactNativeAppStateProvider;
    private readonly _asyncStorageProvider: AsyncStorageProvider;
    private readonly _mistralLlmProvider: MistralLlmProvider;
    private readonly _openAiLlmProvider: OpenAiLlmProvider;
    private readonly _llmService: LlmService;
    private readonly _assessmentHandlerRegistry: AssessmentHandlerRegistry;
    private readonly _coreValuesService: CoreValuesService;
    private readonly _topQualitiesService: TopQualitiesService;
    private readonly _ftuxModel: FtuxModel;
    private readonly _ftuxService: FtuxService;
    private readonly _appStateService: AppStateService;

    constructor() {
        super('AppInitializationService');

        // Initialize and register providers first
        this._supabaseAuthProvider = new SupabaseAuthProvider();
        this._supabaseDataProvider = new SupabaseDataProvider();
        this._supabaseRemoteFunctionProvider = new SupabaseRemoteFunctionProvider();
        this._reactNativeAppStateProvider = new ReactNativeAppStateProvider();
        this._asyncStorageProvider = new AsyncStorageProvider();
        this._mistralLlmProvider = new MistralLlmProvider();
        this._openAiLlmProvider = new OpenAiLlmProvider();
        this._assessmentHandlerRegistry = this.addDependency(AssessmentHandlerRegistry);

        // Register providers before initializing services
        DependencyService.registerValue(LLM_PROVIDER_KEY, this._openAiLlmProvider);
        DependencyService.registerValue(AUTH_PROVIDER_KEY, this._supabaseAuthProvider);
        DependencyService.registerValue(DATA_PROVIDER_KEY, this._supabaseDataProvider);
        DependencyService.registerValue(REMOTE_FUNCTION_PROVIDER_KEY, this._supabaseRemoteFunctionProvider);
        DependencyService.registerValue(APP_STATE_PROVIDER_KEY, this._reactNativeAppStateProvider);
        DependencyService.registerValue(STORAGE_PROVIDER_KEY, this._asyncStorageProvider);

        // Initialize FTUX model and services
        this._ftuxModel = this.addDependency(FtuxModel);
        this._ftuxService = this.addDependency(FtuxService);

        // Initialize services
        this._authService = this.addDependency(AuthService);
        this._dataService = this.addDependency(DataService);
        this._appStateService = this.addDependency(AppStateService);
        this._userProfileService = this.addDependency(UserProfileService);
        this._userAssessmentService = this.addDependency(UserAssessmentService);
        this._remoteFunctionService = this.addDependency(RemoteFunctionService);
        this._llmService = this.addDependency(LlmService);
        this._coreValuesService = this.addDependency(CoreValuesService);
        this._topQualitiesService = this.addDependency(TopQualitiesService);
        this.addDependency(GenerateDataService);
        this.addDependency(UserRelationshipsService);
        this.addDependency(ProfessionalDevelopmentService);
        this.addDependency(MotivationsService);
        this.addDependency(WeaknessesService);
        this.addDependency(ChatService);
        this.addDependency(CareerHistoryService);
        this.addDependency(DigDeeperService);
        this.addDependency(AboutYouService);
        this.addDependency(UserInnerCircleService);
        this.addDependency(UserShortTermGoalService);
        this.addDependency(UserLongTermGoalService);
        this.addDependency(UserMainInterestService);
        this.addDependency(UserQuickInsightService);
    }

    protected async preInitialize?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        try {
            // Initialize providers first
            const authProviderResult = await this._supabaseAuthProvider.initialize();
            if (authProviderResult.isErr()) {
                return err(authProviderResult.error);
            }

            const appStateProviderResult = await this._reactNativeAppStateProvider.initialize();
            if (appStateProviderResult.isErr()) {
                return err(appStateProviderResult.error);
            }

            const dataProviderResult = await this._supabaseDataProvider.initialize();
            if (dataProviderResult.isErr()) {
                return err(dataProviderResult.error);
            }

            const functionProviderResult = await this._supabaseRemoteFunctionProvider.initialize();
            if (functionProviderResult.isErr()) {
                return err(functionProviderResult.error);
            }

            const llmProviderResult = await this._mistralLlmProvider.initialize();
            if (llmProviderResult.isErr()) {
                return err(llmProviderResult.error);
            }

            const openAiLlmProviderResult = await this._openAiLlmProvider.initialize();
            if (openAiLlmProviderResult.isErr()) {
                return err(openAiLlmProviderResult.error);
            }

            // Add a big console statement to show the max concurrent actions
            const maxConcurrentActions = this._openAiLlmProvider.getMaxConcurrentActions();
            console.log('\n\n');
            console.log('*******************************************************************');
            console.log('*                                                                 *');
            console.log(`*   LLM Provider Max Concurrent Actions: ${maxConcurrentActions}   *`);
            console.log('*                                                                 *');
            console.log('*******************************************************************');
            console.log('\n\n');

            // Initialize assessment registry and provider
            const registryResult = await this._assessmentHandlerRegistry.initialize();
            if (registryResult.isErr()) {
                return err(registryResult.error);
            }

            const userId = config?.userId || 'default';

            // Register all assessment handlers
            this._assessmentHandlerRegistry.registerHandler(new MBTIAssessmentHandler(userId));
            this._assessmentHandlerRegistry.registerHandler(new BigFiveAssessmentHandler(userId));
            this._assessmentHandlerRegistry.registerHandler(new DiscAssessmentHandler(userId));
            this._assessmentHandlerRegistry.registerHandler(new CliftonStrengthsAssessmentHandler(userId));
            this._assessmentHandlerRegistry.registerHandler(new EnneagramAssessmentHandler(userId));
            this._assessmentHandlerRegistry.registerHandler(new LoveLanguagesAssessmentHandler(userId));
            this._assessmentHandlerRegistry.registerHandler(new MotivationCodeAssessmentHandler(userId));

            // TODO: a bit dirty, fix at some point

            let messageBuilderService: LlmMessageBuilderService = new LlmMessageBuilderService();
            
            const provider = DependencyService.resolve<ILlmProvider>(LLM_PROVIDER_KEY);
            provider.registerPreProcessor(async (messages: LlmMessage[]): Promise<Result<LlmMessage[], Error>> => {
                    // Filter out any existing system/context messages
                    const awareBotContext = getUserContextFromModels();
                    const awareBotPrompts = messageBuilderService.createContextMessages(awareBotContext);

                    const filteredMessages = messages.filter(msg => 
                        !msg.content.toString().startsWith('You are Aware Bot') &&
                        !msg.content.toString().startsWith('This is some background about me:')
                    );

                    if (awareBotPrompts.isOk()) {
                        const contextMessages = awareBotPrompts.value;
                        return ok([...contextMessages, ...filteredMessages]);
                    }
                    
                    return ok(filteredMessages);
                });


            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to initialize app'));
        }
    }

    protected async onInitialize?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Start auto-refresh for auth
        await this._authService.startAutoRefresh();

        // Configure which ChangeEvent types should be enabled
        configureAppInitChangeTypes();
        
        // Explicitly try to restore the auth session at app initialization
        try {
            const sessionResult = await this._authService.getSession();
            if (sessionResult.isOk() && sessionResult.value) {
                // If we have a valid session, start auto refresh
                await this._authService.startAutoRefresh();
            }
        } catch (error) {
            console.warn('Failed to restore session during initialization:', error);
        }
        
        await this.setupSync();
        return BR_TRUE;
    }

    protected async onEnd?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        try {
            await this._assessmentHandlerRegistry.end();
            await this._supabaseRemoteFunctionProvider.end();
            await this._supabaseDataProvider.end();
            await this._supabaseAuthProvider.end();
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to end app'));
        }
    }

    protected async postInitialize(config?: LifeCycleConfig): Promise<void> {
        // Emit APP_INIT_DONE event after initialization is complete
        emitChange(ChangeType.APP_INIT_DONE, null, 'system');
    }

    protected async setupSync(): Promise<void> {
        this._supabaseDataProvider.registerSync({
            observable: userProfile$,
            syncOptions: {
                persist: {name: 'user_profiles'}
            }
        });

        this._supabaseDataProvider.registerSync({
            observable: userAssessments$,
            syncOptions: {
                persist: {name: 'user_assessments'}
            }
        });

        this._supabaseDataProvider.registerSync({
            observable: userCoreValues$,
            syncOptions: {
                persist: {name: 'user_core_values'}
            }
        });

        this._supabaseDataProvider.registerSync({
            observable: userTopQualities$,
            syncOptions: {
                persist: {name: 'user_top_qualities'}
            }
        });
    }
} 