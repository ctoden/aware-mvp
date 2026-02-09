import {observable} from '@legendapp/state';
import {injectable} from 'tsyringe';
import {ViewModel} from './ViewModel';
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {err, ok, Result} from "neverthrow";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";
import {UserAssessmentService} from '@src/services/UserAssessmentService';
import {user$} from '@src/models/SessionModel';
import {createDichotomies, MBTIDichotomies} from "@src/models/assessments/mbti";
import { FileUploadProgressCallback, FileUploadProgressInfo, getTextFromAssessmentFile } from '@src/utils/AssessmentResultsFileUploadUtils';
import * as DocumentPicker from 'expo-document-picker';
import { NavigationViewModel } from './NavigationViewModel';
import {CoreValuesService} from "@src/services/CoreValuesService";

type SelectedDichotomy = {
    energySelected: boolean;
    informationSelected: boolean;
    decisionSelected: boolean;
    lifestyleSelected: boolean;
}

interface UploadedFile {
    name: string;
    content: string;
    timestamp: number;
}

@injectable()
export class MBTIViewModel extends ViewModel {
    private readonly _userAssessmentService: UserAssessmentService;
    private readonly _navigationViewModel: NavigationViewModel;

    // Observable state
    public readonly isLoading$ = observable<boolean>(false);
    public readonly error$ = observable<string | null>(null);
    public readonly uploadedFiles$ = observable<UploadedFile[]>([]);
    public readonly isMemoryUpdated$ = observable<boolean>(false);

    // MBTI selections
    public readonly selectedDichotomies$ = observable<MBTIDichotomies>(createDichotomies());
    protected readonly dichotomySelections$ = observable<SelectedDichotomy>({
        energySelected: false,
        informationSelected: false,
        decisionSelected: false,
        lifestyleSelected: false
    });

    // todo: when this is updated, attempt to parse the MBTI dichotomies from it
    public readonly mbtiFullTextResult$ = observable<string | null>(null);

    constructor() {
        super("MBTIViewModel");
        this._userAssessmentService = this.addDependency(UserAssessmentService);
        this._navigationViewModel = this.addDependency(NavigationViewModel);
        this.addDependency(CoreValuesService);

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

        this.onChange(this.selectedDichotomies$, (dichotomy) => {
            this.dichotomySelections$.set({
                energySelected: !!dichotomy.value.energy,
                informationSelected: !!dichotomy.value.information,
                decisionSelected: !!dichotomy.value.decision,
                lifestyleSelected: !!dichotomy.value.lifestyle
            })
        })
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    setEnergy(energy: "I" | "E"): void {
        const dichotomy = this.selectedDichotomies$.get();
        this.selectedDichotomies$.set({
            ...dichotomy,
            energy
        });
    }

    setInformation(information: "S" | "N"): void {
        this.selectedDichotomies$.set({
            ...this.selectedDichotomies$.get(),
            information
        });
    }

    setDecision(decision: "T" | "F"): void {
        this.selectedDichotomies$.set({
            ...this.selectedDichotomies$.get(),
            decision
        });
    }

    setLifestyle(lifestyle: "J" | "P"): void {
        this.selectedDichotomies$.set({
            ...this.selectedDichotomies$.get(),
            lifestyle
        });
    }

    getDichotomiesString(): string {
        const dichotomies = this.selectedDichotomies$.get();
        return `${dichotomies.energy || ''}${dichotomies.information || ''}${dichotomies.decision || ''}${dichotomies.lifestyle || ''}`;
    }

    getDichotomies(): MBTIDichotomies {
        return this.selectedDichotomies$.get();
    }

    async handleAssessmentFileUpload(cb:FileUploadProgressCallback): Promise<Result<boolean, Error>> {
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
                cb({
                    type: 'error',
                    text1: 'No File Selected',
                    text2: 'Please select a file to upload',
                });
                return err(new Error('No file selected'));
            }

            const results = await getTextFromAssessmentFile(file, cb);
            if (results.isErr()) {
                cb({
                    type: 'error',
                    text1: 'Error',
                    text2: `Failed to process file ${results.error.message}`,
                });
                return err(results.error);
            }

            return this.saveAssessmentTextResults(results.value, file.name);
        } catch (error) {
            cb({
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
            this.mbtiFullTextResult$.set(text);
            this.isMemoryUpdated$.set(true);
            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process text assessment';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        }
    }

    async processPdfAssessment(pdfBase64: string, fileName: string): Promise<Result<boolean, Error>> {
        try {
            const result = await this._userAssessmentService.processPdfAssessment(pdfBase64, fileName);
            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }
            this.isMemoryUpdated$.set(true);
            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF assessment';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        }
    }

    async processImageAssessment(base64Image: string, fileName: string, mimeType: string): Promise<Result<boolean, Error>> {
        try {
            const result = await this._userAssessmentService.processImageAssessment(base64Image, fileName, mimeType);
            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }
            this.isMemoryUpdated$.set(true);
            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to process image assessment';
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

    // TODO: Get this to work!!!
    async submitAssessment(): Promise<Result<boolean, Error>> {
        if(!this.isSubmitEnabled()) {
            this.error$.set('Please select the MBTI dichotomies before submitting');
            return err(new Error('Please select the MBTI dichotomies before submitting'));
        }
        try {
            this._navigationViewModel.freezeRoute();
            this.isLoading$.set(true);
            this.error$.set(null);

            const currentUser = user$.get();
            if (!currentUser?.id) {
                return err(new Error('No user logged in'));
            }

        
            const result = await this._userAssessmentService.processAssessment('MBTI', {
                dichotomies: this.selectedDichotomies$.get(),
                assessmentResult: this.mbtiFullTextResult$.get(),
                name: "MBTI Assessment",
            });
            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }

            this.isMemoryUpdated$.set(true);
            this._navigationViewModel.unfreezeRoute();
            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit MBTI assessment';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            this.isLoading$.set(false);
        }
    }

    // Helper methods for the view
    isSubmitEnabled(): boolean {
        const dichotomies = this.dichotomySelections$.get();
        return ((dichotomies.energySelected &&
            dichotomies.decisionSelected &&
            dichotomies.informationSelected &&
            dichotomies.lifestyleSelected));
    }
}