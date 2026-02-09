import {CreateCoreValuesAction} from "@src/actions/coreValues/CreateCoreValuesAction";
import {CreateTopQualitiesAction} from "@src/actions/topQualities/CreateTopQualitiesAction";
import {CreateMotivationsAction} from "@src/actions/motivations/CreateMotivationsAction";
import {CreateWeaknessesAction} from "@src/actions/weaknesses/CreateWeaknessesAction";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {getUserCoreValuesArray, ICoreValue} from "@src/models/UserCoreValue";
import {IMotivation} from "@src/models/UserMotivation";
import {IUserTopQuality} from "@src/models/UserTopQuality";
import {getUserWeaknessesArray, IWeakness} from "@src/models/UserWeakness";
import {generateProfileSummaryPrompt} from "@src/prompts/ProfileSummary";
import {ILlmProvider, LLM_PROVIDER_KEY, LlmMessage, LlmModelConfig} from "@src/providers/llm/LlmProvider";
import {err, ok, Result} from "neverthrow";
import {singleton} from "tsyringe";
import {Service} from "./Service";
import {ILlmMessageBuilderService, LlmMessageBuilderService} from "./LlmMessageBuilderService";
import {userInnerCircle$} from "@src/models/UserInnerCircle";
import {getUserMainInterestsArray} from "@src/models/UserMainInterest";
import {getProfessionalDevelopment} from "@src/models/ProfessionalDevelopment";
import {getUserLongTermGoalsArray} from "@src/models/UserLongTermGoal";
import {getUserShortTermGoalsArray} from "@src/models/UserShortTermGoal";
import {userAssessments$} from "@src/models/UserAssessment";
import {z} from "zod";
import {generateUserQuickInsightPrompt} from "@src/prompts/UserQuickInsights";
import {userProfile$} from "@src/models/UserProfile";
import {careerHistory$} from "@src/models/CareerHistoryModel";

@singleton()
export class LlmService extends Service {
    private static _instance: LlmService;
    private _llmProvider: ILlmProvider | null = null;
    private _messageBuilder!: ILlmMessageBuilderService;

    constructor() {
        super('LlmService');
        if (LlmService._instance) {
            return LlmService._instance;
        }
        this._messageBuilder = new LlmMessageBuilderService();
        LlmService._instance = this;
    }

    static getInstance(): LlmService {
        if (!LlmService._instance) {
            LlmService._instance = new LlmService();
        }
        return LlmService._instance;
    }

    get llmProvider(): ILlmProvider | null {
        return this._llmProvider;
    }

    private async getContextMessages(): Promise<Result<LlmMessage[], Error>> {
        try {
            const professionalDev = getProfessionalDevelopment();
            return this._messageBuilder.createContextMessages({
                userProfile: userProfile$.peek(),
                assessments: userAssessments$.peek(),
                coreValues: getUserCoreValuesArray(),
                innerCircle: userInnerCircle$.peek(),
                mainInterests: getUserMainInterestsArray(),
                professionalDevelopment: professionalDev ?? null,
                longTermGoals: getUserLongTermGoalsArray(),
                shortTermGoals: getUserShortTermGoalsArray(),
                weaknesses: getUserWeaknessesArray(),
                careerHistory: careerHistory$.peek() ?? []
            });
        } catch (error) {
            return err(new Error('Failed to get context messages: ' + error));
        }
    }

    private async prependContextMessages(messages: LlmMessage[]): Promise<Result<LlmMessage[], Error>> {
        const contextResult = await this.getContextMessages();
        if (contextResult.isErr()) {
            return err(contextResult.error);
        }
        return ok([...contextResult.value, ...messages]);
    }

    /**
     * Initialize the LLM provider
     * @param config Optional configuration
     */
    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Get the LLM provider
        this._llmProvider = DependencyService.resolveSafe(LLM_PROVIDER_KEY);
        if (!this._llmProvider) {
            return err(new Error('No LLM provider registered'));
        }
        return this._llmProvider.initialize();
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if (!this._llmProvider) {
            return err(new Error('No LLM provider registered'));
        }
        return this._llmProvider.end();
    }

    private ensureProvider(): Result<ILlmProvider, Error> {
        if (!this._llmProvider) {
            return err(new Error('LLM provider not initialized'));
        }
        return ok(this._llmProvider);
    }

    getDefaultModel(): Result<LlmModelConfig, Error> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return ok(providerResult.value.getDefaultModel());
    }

    getAvailableModels(): Result<string[], Error> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return ok(providerResult.value.getAvailableModels());
    }

    async chat(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }

        const messagesWithContext = await this.prependContextMessages(messages);
        if (messagesWithContext.isErr()) {
            return err(messagesWithContext.error);
        }

        return providerResult.value.chat(messagesWithContext.value, config);
    }

    async chatStream(messages: LlmMessage[], config?: LlmModelConfig): Promise<Result<string, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }

        const messagesWithContext = await this.prependContextMessages(messages);
        if (messagesWithContext.isErr()) {
            return err(messagesWithContext.error);
        }

        return providerResult.value.chatStream(messagesWithContext.value, config);
    }

    async generateImageSummary(base64Image: string, mimeType: string, config?: LlmModelConfig): Promise<Result<string, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return providerResult.value.generateImageSummary(base64Image, mimeType, config);
    }

    async generateStructuredOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return providerResult.value.generateStructuredOutput(messages, schema, config);
    }

    async generateJsonSchemaOutput<T>(messages: LlmMessage[], schema: z.ZodType<T>, config?: LlmModelConfig): Promise<Result<T, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return providerResult.value.generateJsonSchemaOutput(messages, schema, config);
    }

    // Helper method for generating summaries (moved from MistralAiService)
    async generateSummary(text: string, config?: LlmModelConfig): Promise<Result<string, Error>> {
        const userProfilePrompt = generateProfileSummaryPrompt();

        const messages: LlmMessage[] = [
            userProfilePrompt,
            {
                role: 'user',
                content: text,
            },
        ];

        return this.chat(messages, config);
    }

    /**
     * Generate core values based on user context
     * @param context The user context to base core values on
     * @param config Optional model configuration
     */
    async generateCoreValues(context: string, config?: LlmModelConfig): Promise<Result<ICoreValue[], Error>> {
        return err(new Error('Not implemented'));
    }

    async generateTopQualities(context: string, config?: LlmModelConfig): Promise<Result<IUserTopQuality[], Error>> {
        if (!this._llmProvider) {
            return err(new Error('LLM provider not initialized'));
        }
        const action = new CreateTopQualitiesAction(this);
        return action.execute(context, config);
    }

    async generateMotivations(context: string, config?: LlmModelConfig): Promise<Result<IMotivation[], Error>> {
        if (!this._llmProvider) {
            return err(new Error('LLM provider not initialized'));
        }
        const action = new CreateMotivationsAction(this._llmProvider);
        return action.execute(context, config);
    }

    async generateWeaknesses(context: string, config?: LlmModelConfig): Promise<Result<IWeakness[], Error>> {
        if (!this._llmProvider) {
            return err(new Error('LLM provider not initialized'));
        }
        const action = new CreateWeaknessesAction(this._llmProvider);
        return action.execute(context, config);
    }

    async generateUserQuickInsight(context: string, config?: LlmModelConfig): Promise<Result<string, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }

        const quickInsightsPrompt = generateUserQuickInsightPrompt(!providerResult.value.supportsStructuredOutputs);

        const messages: LlmMessage[] = [
            quickInsightsPrompt,
        ];

        return providerResult.value.chat(messages, config);
    }
} 