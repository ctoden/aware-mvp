import { injectable } from "tsyringe";
import { ViewModel } from "./ViewModel";
import { observable } from "@legendapp/state";
import { err, ok, Result } from "neverthrow";
import { FileUploadProgressCallback, getTextFromAssessmentFile } from "@src/utils/AssessmentResultsFileUploadUtils";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { UserAssessmentService } from "@src/services/UserAssessmentService";
import { user$ } from "@src/models/SessionModel";
import * as DocumentPicker from 'expo-document-picker';
import { NavigationViewModel } from "./NavigationViewModel";

export interface EnneagramScore {
  name: string;
  score: string;
}

interface UploadedFile {
  name: string;
  content: string;
  timestamp: number;
}

@injectable()
export class EnneagramViewModel extends ViewModel {
  private readonly _userAssessmentService: UserAssessmentService;
  private readonly _navigationViewModel: NavigationViewModel;

  public readonly uploadedFiles$ = observable<UploadedFile[]>([]);
  public readonly scores$ = observable<EnneagramScore[]>([
    { name: 'Type 1 - The Reformer', score: '' },
    { name: 'Type 2 - The Helper', score: '' },
    { name: 'Type 3 - The Achiever', score: '' },
    { name: 'Type 4 - The Individualist', score: '' },
    { name: 'Type 5 - The Investigator', score: '' },
    { name: 'Type 6 - The Loyalist', score: '' },
    { name: 'Type 7 - The Enthusiast', score: '' },
    { name: 'Type 8 - The Challenger', score: '' },
    { name: 'Type 9 - The Peacemaker', score: '' }
  ]);
  public readonly isLoading$ = observable<boolean>(false);
  public readonly error$ = observable<string | null>(null);
  public readonly isMemoryUpdated$ = observable<boolean>(false);
  public readonly enneagramFullTextResult$ = observable<string | null>(null);

  constructor() {
    super("EnneagramViewModel");
    this._userAssessmentService = this.addDependency(UserAssessmentService);
    this._navigationViewModel = this.addDependency(NavigationViewModel);

    // Sync with UserAssessmentService's uploadedFiles
    this.onChange(this._userAssessmentService.uploadedFiles$, (files) => {
      this.uploadedFiles$.set(files.value);
    });

    // Sync loading state
    this.onChange(this._userAssessmentService.loading$, (loading) => {
      this.isLoading$.set(loading.value);
    });

    // Sync error state
    this.onChange(this._userAssessmentService.error$, (error) => {
      this.error$.set(error.value);
    });
  }

  protected async onInitialize(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    return BR_TRUE;
  }

  protected async onEnd(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    return BR_TRUE;
  }

  public updateScore(index: number, value: string): void {
    const newValue = value === '' ? '' : Math.min(Math.max(parseInt(value) || 0, 0), 100).toString();
    const scores = this.scores$.get();
    const updatedScores = [...scores];
    updatedScores[index] = { ...updatedScores[index], score: newValue };
    this.scores$.set(updatedScores);
  }

  public async handleFileUpload(
    progressCallback: FileUploadProgressCallback
  ): Promise<Result<boolean, Error>> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/*', 'application/pdf', 'image/*'],
      });

      if (result.canceled) {
        return ok(false);
      }

      const file = result.assets[0];
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (!fileExtension) {
        progressCallback({
          type: 'error',
          text1: 'No File Selected',
          text2: 'Please select a file to upload',
        });
        return err(new Error('No file selected'));
      }

      const results = await getTextFromAssessmentFile(file, progressCallback);
      if (results.isErr()) {
        progressCallback({
          type: 'error',
          text1: 'Error',
          text2: `Failed to process file ${results.error.message}`,
        });
        return err(results.error);
      }

      return this.saveAssessmentTextResults(results.value, file.name);
    } catch (error) {
      progressCallback({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to process file',
      });
      return err(error instanceof Error ? error : new Error('Failed to process file'));
    }
  }

  async saveAssessmentTextResults(text: string, fileName: string): Promise<Result<boolean, Error>> {
    try {
      const result = await this._userAssessmentService.saveAssessmentFullTextFromFile(text, fileName);
      if (result.isErr()) {
        this.error$.set(result.error.message);
        return err(result.error);
      }
      this.enneagramFullTextResult$.set(text);
      this.isMemoryUpdated$.set(true);
      return ok(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process text assessment';
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    }
  }

  public async removeFile(fileName: string): Promise<Result<boolean, Error>> {
    try {
      await this._userAssessmentService.removeFile(fileName);
      return ok(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove file';
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    }
  }

  public isSubmitEnabled(): boolean {
    return this.scores$.get().every(score => {
      const numScore = parseInt(score.score, 10);
      return !isNaN(numScore) && numScore >= 0 && numScore <= 100;
    });
  }
  
  public async updateAssessment(assessmentId: string): Promise<Result<boolean, Error>> {
    if (!this.isSubmitEnabled()) {
      this.error$.set('Please enter all Enneagram scores before updating');
      return err(new Error('Please enter all Enneagram scores before updating'));
    }

    try {
      this._navigationViewModel.freezeRoute();
      this.isLoading$.set(true);
      this.error$.set(null);

      const scores = this.scores$.get().reduce((acc, score, index) => {
        acc[`type${index + 1}`] = parseInt(score.score);
        return acc;
      }, {} as Record<string, number>);

      // Find highest score for summary
      let highestType = 1;
      let highestScore = scores.type1;
      
      for (let i = 2; i <= 9; i++) {
        const key = `type${i}` as keyof typeof scores;
        if (scores[key] > highestScore) {
          highestScore = scores[key];
          highestType = i;
        }
      }
      
      const scoresStr = `Type ${highestType} (scores: ${Object.entries(scores).map(([key, value]) => `${key}: ${value}`).join(', ')})`;
      
      const result = await this._userAssessmentService.updateAssessment(assessmentId, {
        assessment_summary: scoresStr,
        additional_data: {
          scores,
          assessmentResult: this.enneagramFullTextResult$.get()
        }
      });

      if (result.isErr()) {
        this.error$.set(result.error.message);
        return err(result.error);
      }

      this.isMemoryUpdated$.set(true);
      this._navigationViewModel.unfreezeRoute();
      return ok(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update Enneagram assessment';
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      this.isLoading$.set(false);
    }
  }

  public async submitAssessment(): Promise<Result<boolean, Error>> {
    if (!this.isSubmitEnabled()) {
      this.error$.set('Please enter all Enneagram scores before submitting');
      return err(new Error('Please enter all Enneagram scores before submitting'));
    }

    try {
      this._navigationViewModel.freezeRoute();
      this.isLoading$.set(true);
      this.error$.set(null);

      const scores = this.scores$.get().reduce((acc, score, index) => {
        acc[`type${index + 1}`] = parseInt(score.score);
        return acc;
      }, {} as Record<string, number>);

      const result = await this._userAssessmentService.processAssessment('Enneagram', {
        scores,
        assessmentResult: this.enneagramFullTextResult$.get(),
        name: "Enneagram Personality Assessment",
      });

      if (result.isErr()) {
        this.error$.set(result.error.message);
        return err(result.error);
      }

      this.isMemoryUpdated$.set(true);
      this._navigationViewModel.unfreezeRoute();
      return ok(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit Enneagram assessment';
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      this.isLoading$.set(false);
    }
  }
} 