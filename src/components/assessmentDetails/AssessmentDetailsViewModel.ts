import { ViewModel } from '@src/viewModels/ViewModel';
import { observable } from '@legendapp/state';
import { UserAssessment } from '@src/models/UserAssessment';
import { LifeCycleConfig } from '@src/core/lifecycle/LifeCycleManager';
import { Result, ok } from 'neverthrow';
import { injectable } from 'tsyringe';

@injectable()
export class AssessmentDetailsViewModel extends ViewModel {
    protected onInitialize?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        throw new Error('Method not implemented.');
    }
    protected onEnd?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        throw new Error('Method not implemented.');
    }
    public readonly assessment$ = observable<UserAssessment | null>(null);
    public readonly isLoading$ = observable(false);
    public readonly error$ = observable<string | null>(null);

    constructor() {
        super("AssessmentDetailsViewModel");
    }

    public async initialize(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return this.onInitialize?.(_) ?? ok(true);
    }

    public clear(): void {
        this.assessment$.set(null);
        this.error$.set(null);
    }
}
