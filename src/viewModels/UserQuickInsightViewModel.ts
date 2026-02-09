import {computed, Observable, observable} from "@legendapp/state";
import { ViewModel } from "./ViewModel";
import { injectable } from "tsyringe";
import { UserQuickInsightService } from "@src/services/UserQuickInsightService";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { err, ok, Result } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { userQuickInsights$ } from "@src/models/UserQuickInsightModel";

@injectable()
export class UserQuickInsightViewModel extends ViewModel {
    public readonly insights$ = userQuickInsights$;
    public readonly currentTitle$ = observable<string>('');
    public readonly currentDescription$ = observable<string>('');
    public readonly isLoading$ = observable<boolean>(false);
    public readonly error$ = observable<string | null>(null);
    public readonly isGenerating$ = observable<boolean>(false);

    private readonly _insightService: UserQuickInsightService;

    constructor() {
        super('UserQuickInsightViewModel');
        this._insightService = this.addDependency(UserQuickInsightService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.resetForm();
        return BR_TRUE;
    }

    public readonly isValid$ = observable(() => {
        const title = this.currentTitle$.get().trim();
        const description = this.currentDescription$.get().trim();
        return title.length > 0 && 
               title.length <= 200 && 
               description.length > 0 && 
               description.length <= 2000;
    });

    get generatingText$(): Observable<string> {
        return computed(() => {
            return this.isGenerating$.get() ? 'Generating a new insight for you...' : 'Generate another insight';
        });
    }

    public async generateInsight(): Promise<Result<boolean, Error>> {
        this.isGenerating$.set(true);
        this.error$.set(null);

        // create a deepClone of the insights$
        const insights = this.insights$.get().map(insight => ({
            ...insight,
            created_at: new Date(insight.created_at),
            updated_at: new Date(insight.updated_at)
        }));

        try {
            // delete all insights
            for (const insight of insights) {
                const deleteResult = await this._insightService.deleteInsight(insight.id);
                if (deleteResult.isErr()) {
                    console.error(`Failed to delete insight ${insight.id}:`, deleteResult.error);
                    this.insights$.set(insights);
                    return err(deleteResult.error);
                }
            }

            const result = await this._insightService.generateQuickInsight();
            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }

            return ok(true);
        } finally {
            this.isGenerating$.set(false);
        }
    }

    public async createInsight(): Promise<Result<boolean, Error>> {
        if (!this.isValid$.get()) {
            return err(new Error('Invalid insight data'));
        }

        this.isLoading$.set(true);
        this.error$.set(null);

        try {
            const result = await this._insightService.createInsight(
                this.currentTitle$.get().trim(),
                this.currentDescription$.get().trim()
            );

            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }

            this.resetForm();
            return ok(true);
        } finally {
            this.isLoading$.set(false);
        }
    }

    public async updateInsight(id: string): Promise<Result<boolean, Error>> {
        if (!this.isValid$.get()) {
            return err(new Error('Invalid insight data'));
        }

        this.isLoading$.set(true);
        this.error$.set(null);

        try {
            const result = await this._insightService.updateInsight(id, {
                title: this.currentTitle$.get().trim(),
                description: this.currentDescription$.get().trim()
            });

            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }

            this.resetForm();
            return ok(true);
        } finally {
            this.isLoading$.set(false);
        }
    }

    public async deleteInsight(id: string): Promise<Result<boolean, Error>> {
        this.isLoading$.set(true);
        this.error$.set(null);

        try {
            const result = await this._insightService.deleteInsight(id);
            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }

            return ok(true);
        } finally {
            this.isLoading$.set(false);
        }
    }

    public resetForm(): void {
        this.currentTitle$.set('');
        this.currentDescription$.set('');
        this.error$.set(null);
    }
} 