import { injectable } from "tsyringe";
import { ViewModel } from "./ViewModel";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result, err, ok } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { FtuxService } from "@src/services/FtuxService";
import { GenerateDataService } from "@src/services/GenerateDataService";
import { observable } from "@legendapp/state";
import { ChangeType } from "@src/events/ChangeEvent";

@injectable()
export class IntroducingYouViewModel extends ViewModel {
    private readonly _ftuxService: FtuxService;
    private readonly _generateDataService: GenerateDataService;

    public readonly isLoading$ = observable<boolean>(false);

    constructor() {
        super('IntroducingYouViewModel');
        this._ftuxService = this.addDependency(FtuxService);
        this._generateDataService = this.addDependency(GenerateDataService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    public async handleContinue(): Promise<Result<boolean, Error>> {
        try {
            // Only trigger FTUX data generation if it hasn't been completed
            if (!this._ftuxService.isFtuxCompleted()) {
                this.isLoading$.set(true);

                // Set FTUX as completed first
                const completionResult = await this._ftuxService.setFtuxCompleted(true);
                if (completionResult.isErr()) {
                    return err(completionResult.error);
                }

                // Wait for FTUX data generation to complete
                const results = await Promise.all([
                    this._generateDataService.waitForChangeActions(ChangeType.FTUX, 100_000),
                    this._generateDataService.waitForChangeActions(ChangeType.USER_PROFILE_GENERATE_SUMMARY, 100_000),
                    this._generateDataService.waitForChangeActions(ChangeType.FTUX_COMPLETE, 100_000)
                ]);

                const errors = results.filter(result => result.isErr());
                if (errors.length > 0) {
                    return err(errors[0].error);
                }
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to handle continue'));
        } finally {
            this.isLoading$.set(false);
        }
    }
}
