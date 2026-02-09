import {observable} from '@legendapp/state';
import {ViewModel} from './ViewModel';
import {injectable} from "tsyringe";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {Result, err} from "neverthrow";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";
import {UserAssessmentService} from "@src/services/UserAssessmentService";
import {userAssessments$} from "@src/models/UserAssessment";

@injectable()
export class AssessmentViewModel extends ViewModel {
    private readonly _userAssessmentService: UserAssessmentService;

    isLoading$ = observable<boolean>(false);
    error$ = observable<string | null>(null);
    currentAssessment$ = observable<string | null>(null);

    constructor() {
        super('AssessmentViewModel');
        this._userAssessmentService = DependencyService.resolve(UserAssessmentService);
    }

    /**
     * Sets the current assessment ID for viewing/editing
     * @param assessmentId The ID of the assessment to set as current
     */
    setCurrentAssessment(assessmentId: string): void {
        this.currentAssessment$.set(assessmentId);
    }

    /**
     * Deletes an assessment by ID
     * @param id Assessment ID to delete
     */
    async deleteAssessment(id: string): Promise<Result<boolean, Error>> {
        try {
            this.isLoading$.set(true);
            this.error$.set(null);
            
            const result = await this._userAssessmentService.deleteAssessment(id);
            
            if (result.isErr()) {
                this.error$.set(result.error.message);
                return result;
            }
            
            return result;
        } finally {
            this.isLoading$.set(false);
        }
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    /**
     * Get the currently selected assessment
     * @returns The assessment object or null if none is selected
     */
    public getCurrentAssessment() {
        const assessmentId = this.currentAssessment$.get();
        if (!assessmentId) return null;
        
        const assessments = userAssessments$.get();
        return assessments.find(assessment => assessment.id === assessmentId);
    }

    /**
     * Update an existing assessment
     * @param assessmentId The ID of the assessment to update
     * @param updates The fields to update
     * @returns Result indicating success or failure
     */
    public async updateAssessment(
        assessmentId: string,
        updates: { assessment_summary: string, assessment_data?: any, additional_data?: any }
    ): Promise<Result<boolean, Error>> {
        try {
            this.isLoading$.set(true);
            this.error$.set(null);
            
            const result = await this._userAssessmentService.updateAssessment(assessmentId, updates);
            
            if (result.isErr()) {
                this.error$.set(result.error.message);
                return result;
            }
            
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            this.isLoading$.set(false);
        }
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Clear the current assessment before ending
        this.currentAssessment$.set(null);
        return BR_TRUE;
    }
}
