import {ObservableLifecycleManager} from "@src/core/lifecycle/ObservableLifecycleManager";
import {Result} from "neverthrow";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";

export abstract class Model extends ObservableLifecycleManager {
    readonly name: string;

    protected constructor(name: string) {
        super();
        this.name = name;
    }

    protected abstract onInitialize?(config?: LifeCycleConfig): Promise<Result<boolean, Error>>;
    protected abstract onEnd?(config?: LifeCycleConfig): Promise<Result<boolean, Error>>;
}
