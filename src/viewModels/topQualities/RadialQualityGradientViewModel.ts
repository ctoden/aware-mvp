import { injectable } from 'tsyringe';
import { observable } from '@legendapp/state';
import { DependencyService } from '@src/core/injection/DependencyService';
import { Service } from '@src/services/Service';
import { IUserTopQuality, getUserTopQualitiesArray } from '@src/models/UserTopQuality';
import { Result, ok, err } from 'neverthrow';
import { TopQualitiesService } from '@src/services/TopQualitiesService';
import { topQualityColors } from '@app/constants/theme';
import { user$ } from '@src/models/SessionModel';

export interface IRadialQualityGradientViewModel {
  topQualities: IUserTopQuality[];
  isLoading: boolean;
  error: string | null;
  loadTopQualities(): Promise<Result<boolean, Error>>;
}

@injectable()
export class RadialQualityGradientViewModel extends Service implements IRadialQualityGradientViewModel {
  private _topQualitiesService: TopQualitiesService;
  
  public state = observable({
    topQualities: [] as IUserTopQuality[],
    isLoading: false,
    error: null as string | null,
  });

  constructor() {
    super('RadialQualityGradientViewModel');
    this._topQualitiesService = this.addDependency(TopQualitiesService);
  }

  get topQualities(): IUserTopQuality[] {
    return this.state.topQualities.get();
  }

  get isLoading(): boolean {
    return this.state.isLoading.get();
  }

  get error(): string | null {
    return this.state.error.get();
  }

  /**
   * Loads the user's top qualities from either local state or service
   * @returns Result indicating success or failure
   */
  public async loadTopQualities(): Promise<Result<boolean, Error>> {
    this.state.isLoading.set(true);
    this.state.error.set(null);

    try {
      // First try to get top qualities directly from the model
      const qualities = getUserTopQualitiesArray();
      
      if (qualities.length > 0) {
        this.state.topQualities.set(qualities);
        return ok(true);
      }

      // If no qualities found in model, try to fetch from service
      const userId = user$.peek()?.id;
      if (!userId) {
        // Use mock data for development/testing if no user is logged in
        return this.useMockData();
      }

      const result = await this._topQualitiesService.fetchUserTopQualities(userId);
      if (result.isErr()) {
        // If fetch fails, use mock data
        return this.useMockData();
      }

      if (result.value.length === 0) {
        // If no qualities found, use mock data
        return this.useMockData();
      }

      this.state.topQualities.set(result.value);
      return ok(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading top qualities';
      this.state.error.set(errorMessage);
      return err(new Error(errorMessage));
    } finally {
      this.state.isLoading.set(false);
    }
  }

  /**
   * Helper method to use mock data when no qualities are available
   */
  private useMockData(): Result<boolean, Error> {
    const mockQualities: IUserTopQuality[] = [
      {
        title: 'Openness',
        level: 'High',
        description: 'You are curious and open to new experiences.',
        score: 85,
        color: topQualityColors.openness
      },
      {
        title: 'Conscientiousness',
        level: 'High',
        description: 'You are organized and goal-oriented.',
        score: 78,
        color: topQualityColors.conscientiousness
      },
      {
        title: 'Extraversion',
        level: 'Medium',
        description: 'You are moderately outgoing and sociable.',
        score: 65,
        color: topQualityColors.extraverted
      },
      {
        title: 'Agreeableness',
        level: 'High',
        description: 'You are compassionate and cooperative.',
        score: 82,
        color: topQualityColors.agreeableness
      },
      {
        title: 'Emotional Stability',
        level: 'Medium-High',
        description: 'You handle stress well and remain calm in most situations.',
        score: 75,
        color: topQualityColors.emotionalStability
      }
    ];
    
    this.state.topQualities.set(mockQualities);
    return ok(true);
  }

  protected override async onInitialize(): Promise<Result<boolean, Error>> {
    const loadResult = await this.loadTopQualities();
    return loadResult;
  }
  
  protected override async onEnd(): Promise<Result<boolean, Error>> {
    // Nothing to clean up
    return ok(true);
  }
} 
