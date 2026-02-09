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

export const motivationOptions = [
  'Achievement',
  'Challenge',
  'Creativity',
  'Discovery',
  'Excellence',
  'Growth',
  'Impact',
  'Innovation',
  'Leadership',
  'Learning',
  'Mastery',
  'Purpose',
  'Recognition',
  'Service',
  'Teamwork'
] as const;

interface UploadedFile {
  name: string;
  content: string;
  timestamp: number;
}

@injectable()
export class MotivationCodeViewModel extends ViewModel {
  private readonly _userAssessmentService: UserAssessmentService;
  private readonly _navigationViewModel: NavigationViewModel;

  public readonly uploadedFiles$ = observable<UploadedFile[]>([]);
  public readonly motivations$ = observable<string[]>(['', '', '', '', '']);
  public readonly isLoading$ = observable<boolean>(false);
  public readonly error$ = observable<string | null>(null);
  public readonly isMemoryUpdated$ = observable<boolean>(false);
  public readonly motivationFullTextResult$ = observable<string | null>(null);

  constructor() {
    super("MotivationCodeViewModel");
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

  public updateMotivation(index: number, value: string): void {
    const motivations = this.motivations$.get();
    const updatedMotivations = [...motivations];
    updatedMotivations[index] = value;
    this.motivations$.set(updatedMotivations);
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
      this.motivationFullTextResult$.set(text);
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

  private validateMotivations(): boolean {
    const motivations = this.motivations$.get();
    return motivations.every(motivation => 
      motivation && motivationOptions.includes(motivation as typeof motivationOptions[number])
    );
  }

  public isSubmitEnabled(): boolean {
    return this.validateMotivations();
  }

  public async updateAssessment(assessmentId: string): Promise<Result<boolean, Error>> {
    if (!this.validateMotivations()) {
      const errorMessage = 'Please select valid motivations for all fields';
      this.error$.set(errorMessage);
      return err(new Error(errorMessage));
    }

    try {
      this._navigationViewModel.freezeRoute();
      this.isLoading$.set(true);
      this.error$.set(null);

      const currentUser = user$.get();
      if (!currentUser?.id) {
        return err(new Error('No user logged in'));
      }

      const motivations = this.motivations$.get();
      const motivationsStr = motivations.join(', ');
      
      const result = await this._userAssessmentService.updateAssessment(assessmentId, {
        assessment_summary: motivationsStr,
        additional_data: {
          motivations,
          assessmentResult: this.motivationFullTextResult$.get(),
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to update Motivation Code assessment';
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      this.isLoading$.set(false);
    }
  }

  public async submitAssessment(): Promise<Result<boolean, Error>> {
    if (!this.validateMotivations()) {
      const errorMessage = 'Please select valid motivations for all fields';
      this.error$.set(errorMessage);
      return err(new Error(errorMessage));
    }

    try {
      this._navigationViewModel.freezeRoute();
      this.isLoading$.set(true);
      this.error$.set(null);

      const currentUser = user$.get();
      if (!currentUser?.id) {
        return err(new Error('No user logged in'));
      }

      const result = await this._userAssessmentService.processAssessment('MotivationCode', {
        motivations: this.motivations$.get(),
        assessmentResult: this.motivationFullTextResult$.get(),
        name: "Motivation Code Personality Assessment",
      });

      if (result.isErr()) {
        this.error$.set(result.error.message);
        return err(result.error);
      }

      this.isMemoryUpdated$.set(true);
      this._navigationViewModel.unfreezeRoute();
      return ok(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit Motivation Code assessment';
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      this.isLoading$.set(false);
    }
  }
} 