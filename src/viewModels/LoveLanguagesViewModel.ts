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

export const loveLanguages = [
  'Words of Affirmation',
  'Acts of Service',
  'Receiving Gifts',
  'Quality Time',
  'Physical Touch'
] as const;

interface UploadedFile {
  name: string;
  content: string;
  timestamp: number;
}

@injectable()
export class LoveLanguagesViewModel extends ViewModel {
  private readonly _userAssessmentService: UserAssessmentService;
  private readonly _navigationViewModel: NavigationViewModel;

  public readonly uploadedFiles$ = observable<UploadedFile[]>([]);
  public readonly selectedLanguage$ = observable<string>('');
  public readonly isLoading$ = observable<boolean>(false);
  public readonly error$ = observable<string | null>(null);
  public readonly isMemoryUpdated$ = observable<boolean>(false);
  public readonly loveLanguagesFullTextResult$ = observable<string | null>(null);

  constructor() {
    super("LoveLanguagesViewModel");
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

  public updateLanguage(language: string): void {
    this.selectedLanguage$.set(language);
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
      this.loveLanguagesFullTextResult$.set(text);
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
      this.error$.set('Please select a Love Language before updating');
      return err(new Error('Please select a Love Language before updating'));
    }

    try {
      this._navigationViewModel.freezeRoute();
      this.isLoading$.set(true);
      this.error$.set(null);

      const currentUser = user$.get();
      if (!currentUser?.id) {
        return err(new Error('No user logged in'));
      }

      // Format selected language as text for the summary
      const selectedLanguage = this.selectedLanguage$.get();

      // Create a properly formatted summary text (matches the extraction pattern in the screen)
      const assessmentSummary = `Primary Love Language: ${selectedLanguage}\nDescription: Expressing and receiving affection through ${selectedLanguage.toLowerCase()} and related forms of connection`;

      console.log(`Updating Love Languages assessment ${assessmentId} with language: ${selectedLanguage}`);
      console.log(`Using formatted assessment_summary: ${assessmentSummary}`);

      // Create a consistent data structure for both assessment_data and additional_data
      const updatedData = {
        selectedLanguage: selectedLanguage,
        assessmentResult: this.loveLanguagesFullTextResult$.get(),
      };

      const result = await this._userAssessmentService.updateAssessment(assessmentId, {
        assessment_summary: assessmentSummary,
        assessment_data: updatedData,
        additional_data: updatedData
      });

      if (result.isErr()) {
        console.error(`Error updating Love Languages assessment: ${result.error.message}`);
        this.error$.set(result.error.message);
        return err(result.error);
      }

      console.log(`Successfully updated Love Languages assessment ${assessmentId}`);
      this.isMemoryUpdated$.set(true);
      this._navigationViewModel.unfreezeRoute();
      return ok(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update Love Languages assessment';
      console.error(`Exception in updateAssessment: ${errorMessage}`);
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      this.isLoading$.set(false);
    }
  }

  public async submitAssessment(): Promise<Result<boolean, Error>> {
    if (!this.isSubmitEnabled()) {
      this.error$.set('Please select a Love Language before submitting');
      return err(new Error('Please select a Love Language before submitting'));
    }

    try {
      this._navigationViewModel.freezeRoute();
      this.isLoading$.set(true);
      this.error$.set(null);

      const currentUser = user$.get();
      if (!currentUser?.id) {
        return err(new Error('No user logged in'));
      }

      const selectedLanguage = this.selectedLanguage$.get();
      const assessmentResult = this.loveLanguagesFullTextResult$.get();

      // Create consistent data format
      const assessmentData = {
        selectedLanguage: selectedLanguage,
        assessmentResult: assessmentResult,
      };

      // Create properly formatted summary text
      const assessmentSummary = `Primary Love Language: ${selectedLanguage}\nDescription: Expressing and receiving affection through ${selectedLanguage.toLowerCase()} and related forms of connection`;

      console.log(`Creating Love Languages assessment with language: ${selectedLanguage}`);
      console.log(`Using formatted assessment_summary: ${assessmentSummary}`);

      const result = await this._userAssessmentService.processAssessment('LoveLanguages', {
        selectedLanguage: selectedLanguage,
        assessmentResult: assessmentResult,
        name: "Love Languages",
        assessment_summary: assessmentSummary, // Add formatted summary
        assessment_data: assessmentData,
        additional_data: assessmentData
      });

      if (result.isErr()) {
        this.error$.set(result.error.message);
        return err(result.error);
      }

      this.isMemoryUpdated$.set(true);
      this._navigationViewModel.unfreezeRoute();
      return ok(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit Love Languages assessment';
      this.error$.set(errorMessage);
      return err(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      this.isLoading$.set(false);
    }
  }

  public isSubmitEnabled(): boolean {
    return this.selectedLanguage$.get() !== '';
  }
} 