import { injectable } from "tsyringe";
import { ViewModel } from "./ViewModel";
import { observable } from "@legendapp/state";
import { err, ok, Result } from "neverthrow";
import { FileUploadProgressCallback, FileUploadProgressInfo, getTextFromAssessmentFile } from "@src/utils/AssessmentResultsFileUploadUtils";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { UserAssessmentService } from "@src/services/UserAssessmentService";
import { user$ } from "@src/models/SessionModel";
import * as DocumentPicker from 'expo-document-picker';
import { NavigationViewModel } from "./NavigationViewModel";

export interface CliftonStrength {
  index: number;
  value: string;
}

interface UploadedFile {
  name: string;
  content: string;
  timestamp: number;
}

@injectable()
export class CliftonStrengthsViewModel extends ViewModel {
  private readonly _userAssessmentService: UserAssessmentService;
  private readonly _navigationViewModel: NavigationViewModel;

  public readonly uploadedFiles$ = observable<UploadedFile[]>([]);
  public readonly isLoading$ = observable<boolean>(false);
  public readonly error$ = observable<string | null>(null);
  public readonly isMemoryUpdated$ = observable<boolean>(false);
  public readonly strengthsFullTextResult$ = observable<string | null>(null);

  public readonly strengths$ = observable<CliftonStrength[]>([
    { index: 0, value: "" },
    { index: 1, value: "" },
    { index: 2, value: "" },
    { index: 3, value: "" },
    { index: 4, value: "" },
  ]);

  constructor() {
    super("CliftonStrengthsViewModel");
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

  public updateStrength(index: number, value: string): void {
    const strengths = this.strengths$.get();
    const updatedStrengths = [...strengths];
    updatedStrengths[index] = { index, value };
    this.strengths$.set(updatedStrengths);
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
      this.strengthsFullTextResult$.set(text);
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

  public async updateAssessment(assessmentId: string): Promise<Result<boolean, Error>> {
    if (!this.isSubmitEnabled()) {
      this.error$.set('Please enter all five strengths before updating');
      return err(new Error('Please enter all five strengths before updating'));
    }

    try {
      this._navigationViewModel.freezeRoute();
      this.isLoading$.set(true);
      this.error$.set(null);

      const currentUser = user$.get();
      if (!currentUser?.id) {
        return err(new Error('No user logged in'));
      }

      const strengths = this.strengths$.get().map(s => s.value);
      const strengthsStr = strengths.join(', ');
      
      const result = await this._userAssessmentService.updateAssessment(assessmentId, {
        assessment_summary: strengthsStr,
        additional_data: {
          strengths,
          assessmentResult: this.strengthsFullTextResult$.get(),
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to update CliftonStrengths assessment';
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      this.isLoading$.set(false);
    }
  }

  public async submitAssessment(): Promise<Result<boolean, Error>> {
    if (!this.isSubmitEnabled()) {
      this.error$.set('Please enter all five strengths before submitting');
      return err(new Error('Please enter all five strengths before submitting'));
    }

    try {
      this._navigationViewModel.freezeRoute();
      this.isLoading$.set(true);
      this.error$.set(null);

      const currentUser = user$.get();
      if (!currentUser?.id) {
        return err(new Error('No user logged in'));
      }

      const strengths = this.strengths$.get().map(s => s.value);
      const result = await this._userAssessmentService.processAssessment('CliftonStrengths', {
        strengths,
        assessmentResult: this.strengthsFullTextResult$.get(),
        name: "Clifton Strengths Personality Assessment",
      });

      if (result.isErr()) {
        this.error$.set(result.error.message);
        return err(result.error);
      }

      this.isMemoryUpdated$.set(true);
      this._navigationViewModel.unfreezeRoute();
      return ok(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit CliftonStrengths assessment';
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      this.isLoading$.set(false);
    }
  }

  public isSubmitEnabled(): boolean {
    return this.strengths$.get().every(strength => strength.value.trim() !== '');
  }
} 