import { IUserQuickInsightService } from "@src/actions/userQuickInsights/IUserQuickInsightService";
import { CreateUserQuickInsightAction } from "@src/actions/userQuickInsights/CreateUserQuickInsightAction";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";
import { generateId } from "@src/models/customSupabaseSync";
import { isAuthenticated$, user$ } from "@src/models/SessionModel";
import { userAssessments$ } from "@src/models/UserAssessment";
import {
  addQuickInsight,
  clearQuickInsights,
  removeQuickInsight,
  updateQuickInsight,
  UserQuickInsight,
  userQuickInsights$
} from "@src/models/UserQuickInsightModel";
import { AUTH_PROVIDER_KEY } from "@src/providers/auth/AuthProvider";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { SupabaseDataProvider } from "@src/providers/data/SupabaseDataProvider";
import { ILlmProvider, LLM_PROVIDER_KEY } from "@src/providers/llm/LlmProvider";
import { AuthService } from "@src/services/AuthService";
import { GenerateDataService } from "@src/services/GenerateDataService";
import { generateUUID } from "@src/utils/UUIDUtil";
import { first, isEmpty } from "lodash";
import { err, ok, Result } from "neverthrow";
import { singleton } from "tsyringe";
import { DataService } from "./DataService";
import { EventAwareService } from "./EventAwareService";
import { LlmService } from "./LlmService";
import { FetchUserQuickInsightsAction } from "@src/actions/userQuickInsights/FetchUserQuickInsightsAction";
import { GenerateUserQuickInsightAction } from "@src/actions/userQuickInsights/GenerateUserQuickInsightAction";

@singleton()
export class UserQuickInsightService extends EventAwareService implements IUserQuickInsightService {
  private _dataProvider: SupabaseDataProvider;
  private _authService: AuthService;
  private _llmProvider: ILlmProvider;
  private readonly _dataService!: DataService;
  private readonly _generateDataService!: GenerateDataService;
  private readonly _llmService!: LlmService;

  private _isGeneratingInsights = false;

  constructor() {
    super('UserQuickInsightService', []);
    this._dataProvider = this.addDependency(DATA_PROVIDER_KEY);
    this._authService = this.addDependency(AUTH_PROVIDER_KEY);
    this._llmProvider = this.addDependency(LLM_PROVIDER_KEY);
    this._dataService = this.addDependency(DataService);
    this._generateDataService = this.addDependency(GenerateDataService);
    this._llmService = this.addDependency(LlmService);
  }

  protected async onStateChange(event: ChangeEvent): Promise<void> {}

  protected async onInitialize?(
    _?: LifeCycleConfig
  ): Promise<Result<boolean, Error>> {
    // Register actions for auth changes
    this._generateDataService.registerActions(
      ChangeType.LOGIN,
      [new FetchUserQuickInsightsAction(this)]
    );

    // Register actions for USER_PROFILE_GENERATE_SUMMARY
    this._generateDataService.registerActions(
      ChangeType.USER_PROFILE_GENERATE_SUMMARY,
      [new GenerateUserQuickInsightAction(this, this._llmProvider)]
    );

    // Register actions for FTUX changes
    // this._generateDataService.registerActions(
    //   ChangeType.FTUX,
    //   [
    //     new GenerateUserQuickInsightAction(this, this._llmProvider)
    //   ]
    // );

    // // Register actions for assessment changes
    // this._generateDataService.registerActions(
    //   ChangeType.USER_ASSESSMENT,
    //   [new GenerateUserQuickInsightAction(this, this._llmProvider)]
    // );

    return ok(true);
  }

  protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    await this.clearQuickInsights();
    return ok(true);
  }

  protected async initializeCustomSubscriptions(): Promise<
    Result<boolean, Error>
  > {
    // No additional subscriptions needed as we now use actions
    return ok(true);
  }

  private async getCurrentUserId(): Promise<Result<string, Error>> {
    // Check if authenticated before trying to get user ID
    if (!isAuthenticated$.get()) {
      return err(new Error("User not authenticated"));
    }

    const sessionResult = await this._authService.getSession();
    if (sessionResult.isErr()) {
      return err(sessionResult.error);
    }
    const userId = sessionResult.value?.user?.id;
    if (!userId) {
      return err(new Error("User not authenticated"));
    }
    return ok(userId);
  }

  public async fetchUserInsights(): Promise<Result<UserQuickInsight[], Error>> {
    try {
      // Get the current user ID
      const userIdResult = await this.getCurrentUserId();
      if (userIdResult.isErr()) {
        return err(userIdResult.error);
      }

      const result = await this._dataProvider.fetchData<UserQuickInsight>(
        "user_quick_insights",
        {
          filter: [{ field: "user_id", value: userIdResult.value }],
        }
      );

      if (result.isErr()) {
        return err(result.error);
      }

      // Update the observable state
      if (result.value.length > 0) {
          result.value.forEach((insight) => addQuickInsight(insight));
      }

      return ok(result.value);
    } catch (error) {
      return err(
        error instanceof Error
          ? error
          : new Error("Failed to fetch user insights")
      );
    }
  }

  public async createInsight(
    title: string,
    description: string
  ): Promise<Result<UserQuickInsight, Error>> {
    try {
      // Check authentication first
      if (!isAuthenticated$.get()) {
        return err(new Error("User not authenticated"));
      }

      const userIdResult = await this.getCurrentUserId();
      if (userIdResult.isErr()) {
        return err(userIdResult.error);
      }

      const newInsight: UserQuickInsight = {
        id: generateId(),
        user_id: userIdResult.value,
        title,
        description,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = await this._dataProvider.upsertData<UserQuickInsight>(
        "user_quick_insights",
        newInsight
      );
      if (result.isErr()) {
        return err(result.error);
      }

      const createdInsight = result.value[0];
      addQuickInsight(createdInsight);
      return ok(createdInsight);
    } catch (error) {
      return err(
        error instanceof Error ? error : new Error("Failed to create insight")
      );
    }
  }

  public async updateInsight(
    id: string,
    updates: Partial<Pick<UserQuickInsight, "title" | "description">>
  ): Promise<Result<UserQuickInsight, Error>> {
    try {
      // Check authentication first
      if (!isAuthenticated$.get()) {
        return err(new Error("User not authenticated"));
      }

      let currentInsight = userQuickInsights$
        .get()
        .find((insight: UserQuickInsight) => insight.id === id);
      if (!currentInsight) {
        const result = await this._dataProvider.fetchData<UserQuickInsight>(
          "user_quick_insights",
          {
            filter: [{ field: "id", value: id }],
          }
        );
        if (result.isErr() || !result.value.length) {
          return err(new Error("Insight not found"));
        }
        currentInsight = first(result.value);
        if (!currentInsight) {
          return err(new Error("Insight not found"));
        }
      }

      const updatedInsight: UserQuickInsight = {
        ...currentInsight,
        ...updates,
        updated_at: new Date(),
      };

      const result = await this._dataProvider.updateData<UserQuickInsight>(
        "user_quick_insights",
        updatedInsight
      );
      if (result.isErr()) {
        return err(result.error);
      }

      updateQuickInsight(id, result.value);
      return ok(result.value);
    } catch (error) {
      return err(
        error instanceof Error ? error : new Error("Failed to update insight")
      );
    }
  }

  public async deleteInsight(id: string): Promise<Result<boolean, Error>> {
    try {
      // Check authentication first
      if (!isAuthenticated$.get()) {
        return err(new Error("User not authenticated"));
      }

      const result = await this._dataProvider.deleteData(
        "user_quick_insights",
        {
          filter: [{ field: "id", value: id }],
        }
      );

      if (result.isErr()) {
        return err(result.error);
      }

      removeQuickInsight(id);
      return ok(true);
    } catch (error) {
      return err(
        error instanceof Error ? error : new Error("Failed to delete insight")
      );
    }
  }

  public async generateQuickInsight(): Promise<
    Result<UserQuickInsight, Error>
  > {
    try {
      // Check authentication first
      if (!isAuthenticated$.get()) {
        return err(new Error("User not authenticated"));
      }

      const assessments = userAssessments$.get();
      if (!assessments || assessments.length === 0) {
        return err(new Error("No assessments available to generate insights"));
      }

      const action = new CreateUserQuickInsightAction(this._llmProvider);
      const result = await action.execute(assessments, true);

      if (result.isErr()) {
        return err(result.error);
      }

      if (result.value === "No new assessments to process") {
        return err(new Error("No new assessments to process"));
      }

      if (isEmpty(result.value)) {
        return err(new Error("No new insights to process"));
      }

      const [title, description] = result.value.split("|");
      return await this.createInsight(title, description);
    } catch (error) {
      return err(
        error instanceof Error ? error : new Error("Failed to generate insight")
      );
    }
  }

  async fetchQuickInsights(userId: string): Promise<Result<UserQuickInsight[], Error>> {
    try {
      const result = await this._dataService.fetchData<UserQuickInsight>('user_quick_insights', {
        filter: [{ field: 'user_id', value: userId }]
      });

      if (result.isErr()) {
        return err(result.error);
      }

      // Update local state
      userQuickInsights$.set(result.value);
      return ok(result.value);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to fetch quick insights'));
    }
  }

  async createQuickInsight(insight: Omit<UserQuickInsight, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Result<UserQuickInsight, Error>> {
    const userId = user$.peek()?.id;
    if (!userId) {
      return err(new Error('No user logged in'));
    }

    const newInsight: UserQuickInsight = {
      ...insight,
      id: generateUUID(),
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      const result = await this._dataService.upsertData<UserQuickInsight>('user_quick_insights', [newInsight]);
      if (result.isErr()) {
        return err(result.error);
      }

      // Update local state
      userQuickInsights$.set(prev => [...prev, newInsight]);
      return ok(newInsight);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to create quick insight'));
    }
  }

  async updateQuickInsight(id: string, updates: Partial<Omit<UserQuickInsight, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Result<UserQuickInsight, Error>> {
    const userId = user$.peek()?.id;
    if (!userId) {
      return err(new Error('No user logged in'));
    }

    const currentInsights = userQuickInsights$.peek();
    const existingInsight = currentInsights.find(insight => insight.id === id);
    if (!existingInsight) {
      return err(new Error('Quick insight not found'));
    }

    const updatedInsight: UserQuickInsight = {
      ...existingInsight,
      ...updates,
      updated_at: new Date()
    };

    try {
      const result = await this._dataService.updateData<UserQuickInsight>('user_quick_insights', updatedInsight);
      if (result.isErr()) {
        return err(result.error);
      }

      // Update local state
      userQuickInsights$.set(prev => prev.map(insight => 
        insight.id === id ? updatedInsight : insight
      ));
      return ok(updatedInsight);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to update quick insight'));
    }
  }

  async deleteQuickInsight(id: string): Promise<Result<boolean, Error>> {
    const userId = user$.peek()?.id;
    if (!userId) {
      return err(new Error('No user logged in'));
    }

    try {
      const result = await this._dataService.deleteData('user_quick_insights', {
        filter: [
          { field: 'id', value: id },
          { field: 'user_id', value: userId }
        ]
      });

      if (result.isErr()) {
        return err(result.error);
      }

      // Update local state
      userQuickInsights$.set(prev => prev.filter(insight => insight.id !== id));
      return ok(true);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to delete quick insight'));
    }
  }

  async clearQuickInsights(): Promise<Result<boolean, Error>> {
    userQuickInsights$.set([]);
    return ok(true);
  }
}
