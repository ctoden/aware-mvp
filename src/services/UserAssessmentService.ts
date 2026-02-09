import {singleton} from 'tsyringe';
import { err, ok, Result } from 'neverthrow';

import {
  userAssessments$,
  UserAssessment,
} from '../models/UserAssessment';
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";
import { FileUploadProgressInfo } from "@src/utils/AssessmentResultsFileUploadUtils";
import { AuthService } from './AuthService';
import { DataService } from './DataService';
import { observable } from '@legendapp/state';
import { LlmService } from './LlmService';
import { LocalStorageService } from './LocalStorageService';
import { RemoteFunctionService } from './RemoteFunctionService';
import {AssessmentHandlerRegistry} from "@src/providers/assessment/AssessmentHandlerRegistry";
import {AssessmentResult} from "@src/providers/assessment/AssessmentHandler";
import { generateId } from '@src/models/customSupabaseSync';
import { EventAwareService } from './EventAwareService';
import { ChangeEvent, ChangeType, emitChange } from '@src/events/ChangeEvent';

const STORAGE_KEY = 'uploaded_files';

interface UploadedFile {
  name: string;
  content: string;
  timestamp: number;
}

export type ProcessAssessmentData = { name: string; assessmentResult: string | null } & Record<string, any>;

@singleton()
export class UserAssessmentService extends EventAwareService {
  private _dataService: DataService;
  private _authService: AuthService;
  private _llmService: LlmService;
  private _localStorageService: LocalStorageService;
  private _remoteFunctionService: RemoteFunctionService;
  private readonly _assessmentHandlerRegistry: AssessmentHandlerRegistry;

  public readonly uploadedFiles$ = observable<UploadedFile[]>([]);
  public readonly loading$ = observable<boolean>(false);
  public readonly error$ = observable<string | null>(null);
  public readonly assessmentText$ = observable<string>('');
  public readonly assessmentSummary$ = observable<string>('');

  constructor() {
    super('UserAssessmentService', [
      ChangeType.LOGIN,
      ChangeType.LOGOUT
    ]);
    this._authService = this.addDependency(AuthService);
    this._dataService = this.addDependency(DataService);
    this._llmService = this.addDependency(LlmService);
    this._localStorageService = this.addDependency(LocalStorageService);
    this._remoteFunctionService = this.addDependency(RemoteFunctionService);
    this._assessmentHandlerRegistry = this.addDependency(AssessmentHandlerRegistry);
  }

  protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    try {
      await this.loadUploadedFiles();
      return ok(true);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to initialize UserAssessmentService'));
    }
  }

  protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    return BR_TRUE;
  }

  protected async onStateChange(event: ChangeEvent): Promise<void> {
    switch (event.type) {
      case ChangeType.LOGIN:
        if(!this._authService.isAuthenticated()) {
          console.warn("~~~ UserAssessmentService: Not authenticated, skipping fetchAssessments");
          return;
        }
        const textsResult = await this.fetchAssessments(this._authService.currentUser$.get()?.id || '');
        if (textsResult.isOk() && textsResult.value) {
          userAssessments$.set(textsResult.value);
        } else {
          console.warn("~~~ UserAssessmentService: Failed to fetch assessments for user", this._authService.currentUser$.get()?.id);
        }
        break;

      case ChangeType.LOGOUT:
        // Clear assessments when user signs out
        userAssessments$.set([]);
        break;
    }
  }

  protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
    // Listen for changes to userAssessments
    this.onChange(userAssessments$, (async (change) => {
      const texts = change.value;
      if (texts && texts.length > 0) {
        await this.updateAssessmentTexts(texts);
      }
    }));

    return ok(true);
  }

  async fetchAssessments(userId: string): Promise<Result<UserAssessment[], Error>> {
    return this._dataService.fetchData<UserAssessment>('user_assessments', {
      filter: [{ field: 'user_id', value: userId }]
    });
  }

  private async updateAssessmentTexts(texts: UserAssessment[]): Promise<Result<UserAssessment[], Error>> {
    return this._dataService.upsertData<UserAssessment>('user_assessments', texts);
  }

  /**
   * Update an existing assessment
   * @param assessmentId The ID of the assessment to update
   * @param updates Fields to update
   * @returns Result indicating success or failure
   */
  async updateAssessment(
    assessmentId: string,
    updates: { assessment_summary: string, assessment_data?: any, additional_data?: any }
  ): Promise<Result<boolean, Error>> {
    try {
      // Get current user ID
      const userId = this._authService.currentUser$.get()?.id;
      if (!userId) {
        return err(new Error('User not authenticated'));
      }

      // Find the assessment to update
      const currentAssessments = userAssessments$.get();
      const assessmentIndex = currentAssessments.findIndex(a => a.id === assessmentId);

      if (assessmentIndex === -1) {
        return err(new Error(`Assessment with ID ${assessmentId} not found`));
      }

      // Create updated assessment
      const updatedAssessment = {
        ...currentAssessments[assessmentIndex],
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Update local state with a new array reference
      const updatedAssessments = [...currentAssessments];
      updatedAssessments[assessmentIndex] = updatedAssessment;
      userAssessments$.set(updatedAssessments);

      // Update in database
      // Ensure the ID is in the updated assessment object
      updatedAssessment.id = assessmentId;

      // Update in database with correct parameter count
      const result = await this._dataService.updateData('user_assessments', updatedAssessment);
      if (result.isErr()) {
        // Map the error result to match our return type
        return err(result.error);
      }

      // Emit change event
      emitChange(ChangeType.ASSESSMENT_UPDATED, { assessmentId });
      return BR_TRUE;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to update assessment'));
    }
  }

  async deleteAssessment(id: string): Promise<Result<boolean, Error>> {
    try {
      // Get current user ID
      const userId = this._authService.currentUser$.get()?.id;
      if (!userId) {
        return err(new Error('User not authenticated'));
      }

      // Update local state
      const currentAssessments = userAssessments$.get();

      // Check if assessment exists
      const assessmentExists = currentAssessments.some(a => a.id === id);

      // If assessment doesn't exist, return success (no-op)
      if (!assessmentExists) {
        return BR_TRUE;
      }

      const updatedAssessments = currentAssessments.filter(a => a.id !== id);
      userAssessments$.set(updatedAssessments);

      // Delete from database
      const result = await this._dataService.deleteData('user_assessments', {
        filter: [{ field: 'id', value: id }]
      });

      // Even if the database delete fails, we've already updated the local state
      // This ensures the UI remains consistent
      if (result.isErr()) {
        console.warn(`Failed to delete assessment from database: ${result.error.message}`);
        // We don't return an error here to keep the UI consistent with the local state
      }

      emitChange(ChangeType.ASSESSMENT_DELETED, { assessmentId: id });
      return BR_TRUE;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Failed to delete assessment'));
    }
  }

  /**
   * Load uploaded files from local storage
   */
  private async loadUploadedFiles(): Promise<void> {
    try {
      const result = await this._localStorageService.getItem(STORAGE_KEY);
      if (result.isOk() && result.value) {
        this.uploadedFiles$.set(JSON.parse(result.value));
      }
    } catch (error) {
      console.error('Error loading files:', error);
    }
  }

  /**
   * Save uploaded files to local storage
   * @param files Array of uploaded files to save
   */
  private async saveUploadedFiles(files: UploadedFile[]): Promise<void> {
    try {
      const result = await this._localStorageService.setItem(STORAGE_KEY, JSON.stringify(files));
      if (result.isErr()) {
        console.error('Error saving files:', result.error);
      }
    } catch (error) {
      console.error('Error saving files:', error);
    }
  }

  /**
   * Handle file upload for assessment results
   * @param onProgress Callback for upload progress updates
   */
  async handleAssessmentFileUpload(onProgress?: (progressInfo: FileUploadProgressInfo) => void): Promise<Result<boolean, Error>> {
    try {
      // Implementation details would go here
      return BR_TRUE;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Error uploading file'));
    }
  }

  /**
   * Remove an uploaded file by name
   * @param fileName Name of the file to remove
   */
  async removeFile(fileName: string): Promise<Result<boolean, Error>> {
    try {
      const currentFiles = this.uploadedFiles$.get();
      const updatedFiles = currentFiles.filter(file => file.name !== fileName);
      this.uploadedFiles$.set(updatedFiles);
      await this.saveUploadedFiles(updatedFiles);
      return BR_TRUE;
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Error removing file'));
    }
  }

  async processAssessment(type: string, data: ProcessAssessmentData): Promise<Result<AssessmentResult, Error>> {
    const userId = this._authService.currentUser$.get()?.id;
    if (!userId) {
      return err(new Error('User not authenticated'));
    }

    const handlerResult = this._assessmentHandlerRegistry.getHandler(type);
    if (handlerResult.isErr()) return err(handlerResult.error);

    const result = await handlerResult.value.generateSummary(data);
    const { assessmentResult, name } = data;
    if (result.isOk()) {
      // Create assessment object
      const assessment: UserAssessment = {
        assessment_full_text: assessmentResult,
        assessment_summary: result.value,
        assessment_type: type,
        created_at: new Date().toISOString(),
        id: generateId(),
        name: name,
        updated_at: new Date(Date.now() + 1000).toISOString(),
        user_id: userId,
        assessment_data: data.assessment_data || null,
        additional_data: data.additional_data || null
      }

      // Update the observable state with a new reference
      // This will trigger the subscription that saves to the database
      const currentAssessments = userAssessments$.peek();
      userAssessments$.set([...currentAssessments, assessment]);



      return ok({ assessment });
    }

    return err(result.error);
  }

  public async saveAssessmentFullTextFromFile(text: string, fileName: string): Promise<Result<boolean, Error>> {
    this.loading$.set(true);
    this.error$.set(null);

    let results: Result<boolean, Error> = ok(false);

    try {
      const newFile: UploadedFile = {
        name: fileName,
        content: text,
        timestamp: Date.now(),
      };

      const currentFiles = this.uploadedFiles$.get();
      const updatedFiles = [...currentFiles, newFile];
      this.uploadedFiles$.set(updatedFiles);
      await this.saveUploadedFiles(updatedFiles);
      results = BR_TRUE;
    } catch (error) {
      this.error$.set(error instanceof Error ? error.message : 'Unknown error occurred');
      results = err(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      this.loading$.set(false);
    }

    return results;
  }

  public async processPdfAssessment(pdfBase64: string, fileName: string): Promise<Result<boolean, Error>> {
    this.loading$.set(true);
    this.error$.set(null);

    let results: Result<boolean, Error> = ok(false);
    try {
      const pdfResult = await this._remoteFunctionService.parsePdf(pdfBase64);
      if (pdfResult.isErr()) {
        this.error$.set(pdfResult.error.message);
        return err(pdfResult.error);
      }

      const pdf = pdfResult.value.text;
      results = await this.saveAssessmentFullTextFromFile(pdf, fileName);
    } catch (error) {
      this.error$.set(error instanceof Error ? error.message : 'Unknown error occurred');
      results = err(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      this.loading$.set(false);
    }

    return results;
  }

  public async processImageAssessment(base64Image: string, fileName: string, mimeType: string): Promise<Result<boolean, Error>> {
    console.log("Processing image assessment", base64Image, fileName, mimeType);
    this.loading$.set(true);
    this.error$.set(null);

    let results: Result<boolean, Error> = ok(false);
    try {
      const result = await this._llmService.generateImageSummary(base64Image, mimeType);

      if (result.isOk()) {
        const ocrResults = result.value;
        results = await this.saveAssessmentFullTextFromFile(ocrResults, fileName);
      } else {
        this.error$.set(result.error.message);
        results = err(result.error);
      }
    } catch (error) {
      this.error$.set(error instanceof Error ? error.message : 'Unknown error occurred');
      results = err(error instanceof Error ? error : new Error('Unknown error occurred'));
    } finally {
      this.loading$.set(false);
    }

    return results;
  }

  // Implementation moved to the main removeFile method above

}