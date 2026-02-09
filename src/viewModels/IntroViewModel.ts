import { observable } from '@legendapp/state';
import { ViewModel } from './ViewModel';
import { injectable } from "tsyringe";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result, err, ok } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { FtuxService } from "@src/services/FtuxService";
import { ftuxState$ } from "@src/models/FtuxModel";

const TOTAL_INTRO_STEPS = 3;

export const INTRO_STEP_CONTENT = [
    {
        title: "Be aware of all of you",
        description: "Add every personality assessment you have taken and get meshed awareness and advice with all your unique attributes considered."
    },
    {
        title: "Personalized Insights", 
        description: "Get detailed insights about your personality and cognitive patterns"
    },
    {
        title: "Start Your Journey",
        description: "Begin with our carefully curated assessments to understand yourself better"
    }
] as const;

@injectable()
export class IntroViewModel extends ViewModel {
    private readonly _ftuxService: FtuxService;

    isLoading$ = observable<boolean>(false);
    error$ = observable<string | null>(null);

    constructor() {
        super('IntroViewModel');
        this._ftuxService = this.addDependency(FtuxService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    get currentStep(): number {
        return ftuxState$.currentStep.get();
    }

    get totalSteps(): number {
        return TOTAL_INTRO_STEPS;
    }

    get lastStep(): number {
        return this.totalSteps - 1;
    }

    nextStep(): void {
        const currentStep = this.currentStep;
        if (currentStep < TOTAL_INTRO_STEPS - 1) {
            this._ftuxService.setCurrentStep(currentStep + 1);
        }
    }

    async completeIntro(): Promise<Result<void, Error>> {
        // Mark intro as completed in the FtuxModel
        const result = await this._ftuxService.setIntroCompleted(true);
        if (result.isErr()) {
            return err(result.error);
        }
        return ok(undefined);
    }

    isLastStep(): boolean {
        return this.currentStep === this.totalSteps - 1;
    }

    getStepContent(step: number): { title: string; description: string } {
        return INTRO_STEP_CONTENT[step] || {
            title: "",
            description: ""
        };
    }
} 