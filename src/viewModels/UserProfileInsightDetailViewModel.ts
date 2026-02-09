import { observable } from '@legendapp/state';
import { injectable } from 'tsyringe';
import { Result, ok, err } from 'neverthrow';
import { ViewModel } from './ViewModel';
import { LifeCycleConfig } from '@src/core/lifecycle/LifeCycleManager';
import { BR_TRUE } from '@src/utils/NeverThrowUtils';
import { ProfileInsight, selectedProfileInsight$ } from '@src/models/ProfileInsightModel';
import { LlmService } from '@src/services/LlmService';
import { getUserProfileInsightDetailsPrompt } from '@src/prompts/UserProfileInsightDetailsPrompts';

@injectable()
export class UserProfileInsightDetailViewModel extends ViewModel {
  // Observable state
  insight$ = observable<ProfileInsight | null>(null);
  isLoading$ = observable<boolean>(false);
  mainContent$ = observable<string>('');
  isContentLoading$ = observable<boolean>(false);
  
  private _llmService!: LlmService;
  
  constructor() {
    super('UserProfileInsightDetailViewModel');
    this._llmService = this.addDependency(LlmService);
  }

  protected async onInitialize(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    try {
      this.isLoading$.set(true);
      
      // Subscribe to changes in the shared ProfileInsight
      this.onChange(selectedProfileInsight$, async (insight) => {
        this.insight$.set(insight.value);
        if (insight.value) {
          await this.generateMainContent();
        }
      });
      
      // Get the current value
      const currentInsight = selectedProfileInsight$.get();
      if (currentInsight) {
        this.insight$.set(currentInsight);
        await this.generateMainContent();
      }
      
      this.isLoading$.set(false);
      return ok(true);
    } catch (error) {
      this.isLoading$.set(false);
      return err(error instanceof Error ? error : new Error('Failed to initialize ProfileInsight'));
    }
  }
  
  protected async onEnd(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    return BR_TRUE;
  }

  // Method to set the insight data
  setInsightData(insight: ProfileInsight): Result<boolean, Error> {
    try {
      this.insight$.set(insight);
      return ok(true);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to set insight data'));
    }
  }
  
  // Generate the main content using LlmService
  async generateMainContent(): Promise<Result<boolean, Error>> {
    try {
      const insight = this.insight$.get();
      if (!insight) {
        return err(new Error('No insight data available'));
      }
      
      this.isContentLoading$.set(true);
      
      // Get the prompt using the insight's category and title
      const prompt = getUserProfileInsightDetailsPrompt(insight.category, insight.title);
      
      // Call LLM service to generate content
      const contentResult = await this._llmService.chat([
        { role: 'user', content: prompt }
      ]);
      
      this.isContentLoading$.set(false);
      
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      
      this.mainContent$.set(contentResult.value);
      return ok(true);
    } catch (error) {
      this.isContentLoading$.set(false);
      return err(error instanceof Error ? error : new Error('Failed to generate main content'));
    }
  }
} 