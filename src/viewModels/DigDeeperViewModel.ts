import { observable } from "@legendapp/state";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { ViewModel } from "@src/viewModels/ViewModel"
import { digDeeperQuestions$, DigDeeperQuestion } from "@src/models/DigDeeperQuestion";
import { DigDeeperService } from "@src/services/DigDeeperService";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { err, ok, Result } from "neverthrow";
import { injectable } from "tsyringe";

interface DigDeeperState {
    isLoading: boolean;
    error: string | null;
}

@injectable()
export class DigDeeperViewModel extends ViewModel {
    private readonly _digDeeperService: DigDeeperService;

    // Public observables
    public readonly questions$ = digDeeperQuestions$;
    public readonly state$ = observable<DigDeeperState>({
        isLoading: false,
        error: null
    });

    constructor() {
        super('DigDeeperViewModel');
        this._digDeeperService = this.addDependency(DigDeeperService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Clean up any subscriptions or state
        this.state$.set({
            isLoading: false,
            error: null
        });
        return BR_TRUE;
    }

    public async generateQuestions(userContext: string): Promise<Result<boolean, Error>> {
        this.state$.set({
            ...this.state$.get(),
            isLoading: true,
            error: null
        });

        try {
            const result = await this._digDeeperService.ensureMinimumPendingQuestions();
            if (result.isErr()) {
                this.state$.set({
                    ...this.state$.get(),
                    isLoading: false,
                    error: result.error.message
                });
                return err(result.error);
            }

            this.state$.set({
                ...this.state$.get(),
                isLoading: false
            });

            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate questions';
            this.state$.set({
                ...this.state$.get(),
                isLoading: false,
                error: errorMessage
            });
            return err(new Error(errorMessage));
        }
    }

    public async answerQuestion(question: DigDeeperQuestion, answer: string): Promise<Result<boolean, Error>> {
        if (!question) {
            return err(new Error('Question is required'));
        }

        this.state$.set({
            ...this.state$.get(),
            isLoading: true,
            error: null
        });

        try {
            const result = await this._digDeeperService.answerQuestion(question.id, answer);
            if (result.isErr()) {
                this.state$.set({
                    ...this.state$.get(),
                    isLoading: false,
                    error: result.error.message
                });
                return err(result.error);
            }

            this.state$.set({
                ...this.state$.get(),
                isLoading: false
            });

            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to answer question';
            this.state$.set({
                ...this.state$.get(),
                isLoading: false,
                error: errorMessage
            });
            return err(new Error(errorMessage));
        }
    }

    public async skipQuestion(question: DigDeeperQuestion): Promise<Result<boolean, Error>> {
        if (!question) {
            return err(new Error('Question is required'));
        }

        this.state$.set({
            ...this.state$.get(),
            isLoading: true,
            error: null
        });

        try {
            const result = await this._digDeeperService.skipQuestion(question.id);
            if (result.isErr()) {
                this.state$.set({
                    ...this.state$.get(),
                    isLoading: false,
                    error: result.error.message
                });
                return err(result.error);
            }

            this.state$.set({
                ...this.state$.get(),
                isLoading: false
            });

            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to skip question';
            this.state$.set({
                ...this.state$.get(),
                isLoading: false,
                error: errorMessage
            });
            return err(new Error(errorMessage));
        }
    }

    public resetError(): void {
        this.state$.set({
            ...this.state$.get(),
            error: null
        });
    }
}

// Create singleton instance
export const digDeeperViewModel = new DigDeeperViewModel(); 