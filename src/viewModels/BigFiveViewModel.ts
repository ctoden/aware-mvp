import { observable } from '@legendapp/state';
import { injectable } from 'tsyringe';
import { ViewModel } from './ViewModel';
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { err, ok, Result } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { UserAssessmentService } from '@src/services/UserAssessmentService';
import { user$ } from '@src/models/SessionModel';
import { FileUploadProgressCallback, getTextFromAssessmentFile } from '@src/utils/AssessmentResultsFileUploadUtils';
import * as DocumentPicker from 'expo-document-picker';
import { NavigationViewModel } from './NavigationViewModel';

interface BigFiveScore {
    name: string;
    score: string;
}

interface UploadedFile {
    name: string;
    content: string;
    timestamp: number;
}

@injectable()
export class BigFiveViewModel extends ViewModel {
    private readonly _userAssessmentService: UserAssessmentService;
    private readonly _navigationViewModel: NavigationViewModel;

    // Observable state
    public readonly isLoading$ = observable<boolean>(false);
    public readonly error$ = observable<string | null>(null);
    public readonly uploadedFiles$ = observable<UploadedFile[]>([]);
    public readonly isMemoryUpdated$ = observable<boolean>(false);

    // Big Five scores
    public readonly scores$ = observable<BigFiveScore[]>([
        { name: 'Openness', score: '' },
        { name: 'Conscientiousness', score: '' },
        { name: 'Extraversion', score: '' },
        { name: 'Agreeableness', score: '' },
        { name: 'Neuroticism', score: '' }
    ]);

    // Full text result from file upload
    public readonly bigFiveFullTextResult$ = observable<string | null>(null);

    constructor() {
        super("BigFiveViewModel");
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

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    updateScore(index: number, value: string): void {
        const scores = this.scores$.get();
        if (index >= 0 && index < scores.length) {
            const numericValue = value.replace(/[^0-9]/g, '');
            const score = numericValue === '' ? '' : Math.min(Math.max(parseInt(numericValue, 10), 0), 120).toString();
            this.scores$[index].score.set(score);
        }
    }

    async handleFileUpload(): Promise<Result<boolean, Error>> {
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
                this.error$.set('No file selected');
                return err(new Error('No file selected'));
            }

            const progressCallback: FileUploadProgressCallback = (info) => {
                if (info.type === 'error') {
                    this.error$.set(info.text2);
                }
            };

            const results = await getTextFromAssessmentFile(file, progressCallback);
            if (results.isErr()) {
                this.error$.set(results.error.message);
                return err(results.error);
            }

            return this.saveAssessmentTextResults(results.value, file.name);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        }
    }

    async saveAssessmentTextResults(text: string, fileName: string): Promise<Result<boolean, Error>> {
        try {
            const result = await this._userAssessmentService.saveAssessmentFullTextFromFile(text, fileName);
            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }
            this.bigFiveFullTextResult$.set(text);
            this.isMemoryUpdated$.set(true);
            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process text assessment';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        }
    }

    async removeFile(fileName: string): Promise<Result<boolean, Error>> {
        try {
            await this._userAssessmentService.removeFile(fileName);
            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to remove file';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        }
    }

    async updateAssessment(assessmentId: string): Promise<Result<boolean, Error>> {
        if (!this.isSubmitEnabled()) {
            this.error$.set('Please enter all Big Five scores before updating');
            return err(new Error('Please enter all Big Five scores before updating'));
        }

        try {
            this._navigationViewModel.freezeRoute();
            this.isLoading$.set(true);
            this.error$.set(null);

            const currentUser = user$.get();
            if (!currentUser?.id) {
                return err(new Error('No user logged in'));
            }

            const scores = this.scores$.get().reduce((acc, score) => {
                acc[score.name.toLowerCase()] = parseInt(score.score, 10);
                return acc;
            }, {} as Record<string, number>);

            const scoresStr = Object.entries(scores).map(([key, value]) => `${key}: ${value}`).join(', ');
            
            const result = await this._userAssessmentService.updateAssessment(assessmentId, {
                assessment_summary: scoresStr,
                additional_data: {
                    scores,
                    assessmentResult: this.bigFiveFullTextResult$.get()
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
            const errorMessage = error instanceof Error ? error.message : 'Failed to update Big Five assessment';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            this.isLoading$.set(false);
        }
    }

    async submitAssessment(): Promise<Result<boolean, Error>> {
        if (!this.isSubmitEnabled()) {
            this.error$.set('Please enter all Big Five scores before submitting');
            return err(new Error('Please enter all Big Five scores before submitting'));
        }

        try {
            this._navigationViewModel.freezeRoute();
            this.isLoading$.set(true);
            this.error$.set(null);

            const currentUser = user$.get();
            if (!currentUser?.id) {
                return err(new Error('No user logged in'));
            }

            const scores = this.scores$.get().reduce((acc, score) => {
                acc[score.name.toLowerCase()] = parseInt(score.score, 10);
                return acc;
            }, {} as Record<string, number>);

            const result = await this._userAssessmentService.processAssessment('BigFive', {
                scores,
                assessmentResult: this.bigFiveFullTextResult$.get(),
                name: "Big Five Personality Assessment",
            });

            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }

            this.isMemoryUpdated$.set(true);
            this._navigationViewModel.unfreezeRoute();
            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit Big Five assessment';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            this.isLoading$.set(false);
        }
    }

    isSubmitEnabled(): boolean {
        return this.scores$.get().every(score => {
            const numScore = parseInt(score.score, 10);
            return !isNaN(numScore) && numScore >= 0 && numScore <= 120;
        });
    }
} 