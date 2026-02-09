import { injectable } from "tsyringe";
import { ViewModel } from "./ViewModel";
import { Result, ok } from "neverthrow";

@injectable()
export class ExploreScreenViewModel extends ViewModel {
    constructor() {
        super('ExploreScreenViewModel');
    }

    protected async onInitialize(): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async onEnd(): Promise<Result<boolean, Error>> {
        return ok(true);
    }
} 