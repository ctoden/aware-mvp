import {nanoid} from "nanoid";
import {GlobalContextService} from "@src/core/injection/GlobalContextService";
import {getObjectName, hasLifeCycle, LifeCycleConfig, LifeCycleManager} from "@src/core/lifecycle/LifeCycleManager";
import {ListenerFn, Observable, observable} from "@legendapp/state";
import {err, ok, Result} from "neverthrow";
import {clone, get, pull} from "lodash";
import {isResultTrue} from "@src/utils/NeverThrowUtils";
import {InjectionToken} from "tsyringe";
import {DependencyService} from "@src/core/injection/DependencyService";
import {getFromEnv, parseBoolean} from "@src/utils/EnvUtils";

const SHOULD_LOG_LIFE_CYCLE = parseBoolean(getFromEnv('SHOULD_LOG_LIFE_CYCLE', 'false'));
const SHOULD_LOG_LIFE_CYCLE_ERRORS = parseBoolean(getFromEnv('SHOULD_LOG_LIFE_CYCLE_ERRORS', 'false'));
export const lifeCycleLog = SHOULD_LOG_LIFE_CYCLE ? console.log : () => {};
export const lifeCycleErrorLog = SHOULD_LOG_LIFE_CYCLE_ERRORS ? console.error : () => {};

console.log('SHOULD_LOG_LIFE_CYCLE', SHOULD_LOG_LIFE_CYCLE);
console.log('SHOULD_LOG_LIFE_CYCLE_ERRORS', SHOULD_LOG_LIFE_CYCLE_ERRORS);


export abstract class ObservableLifecycleManager implements LifeCycleManager {
    abstract name: string;
    protected _id: string = '';
    protected initGuard = 0;
    protected _memoKey: string = '';
    protected _isSSR = true;
    protected dependencies: Array<any>;
    protected observableSubscriptions: Array<()=>void> = [];

    isInitialized = observable(false);

    protected constructor(_id = nanoid(7)) {
        this._memoKey = this._id = _id;
        this._isSSR = GlobalContextService.Get().isSSR;
        this.dependencies = new Array<any>();
    }

    protected abstract onInitialize?(config?: LifeCycleConfig): Promise<Result<boolean, Error>>;
    protected abstract onEnd?(config?: LifeCycleConfig): Promise<Result<boolean, Error>>;

    public async initialize(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.initGuard += 1;

        lifeCycleLog(
            `!!!!! ${getObjectName(this)} initialize() called. Total holds: ${this.initGuard}`
        );

        if (this.initGuard > 1) {
            return ok(true);
        }

        lifeCycleLog(`~~~ ${getObjectName(this)} initializing`);

        const preInitialize = get(this, 'preInitialize') as Function;
        if (preInitialize) {
            await preInitialize.call(this, config);
        }

        let result = await this.initializeDependencies(config);
        // only initialize this if the dependencies are okay.
        if (!isResultTrue(result)) {
            if (result.isErr()) {
                lifeCycleErrorLog(`${getObjectName(this)} dependency initialization failed:`, result.error);
            }
            return err(new Error('Dependency did not return true from initialization'));
        }

        if (this.onInitialize) {
            result = await this.onInitialize(config);
            if (result.isErr()) {
                lifeCycleErrorLog(`${getObjectName(this)} onInitialize failed:`, result.error);
            }
        }
        this.isInitialized.set(result.isOk());

        const postInitialize = get(this, 'postInitialize') as Function;
        if (postInitialize) {
            await postInitialize.call(this, config);
        }

        return result;
    }


    public async end(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.initGuard -= 1;

        lifeCycleLog(`!!!!! ${getObjectName(this)} end() called. Remaining holds: ${this.initGuard}`);

        if (this.initGuard > 0) {
            return ok(true);
        }

        this.initGuard = 0;

        lifeCycleLog(`~~~ ${getObjectName(this)} ending - all holds removed`);

        for(const unSubscribe of this.observableSubscriptions) {
            unSubscribe();
        }

        this._memoKey = nanoid(10);
        let result: Result<boolean, Error> = ok(true);
        if (this.onEnd) {
            result = await this.onEnd(config);
            if (result.isErr()) {
                lifeCycleErrorLog(`${getObjectName(this)} onEnd failed:`, result.error);
            }
        }

        const depEndResults = await this.endDependencies();
        this.isInitialized.set(false);

        if (!isResultTrue(result) || !isResultTrue(depEndResults)) {
            lifeCycleErrorLog(`${getObjectName(this)} end failed - dependencies did not end correctly`);
            return err(new Error('Dependencies did not end correctly'));
        }

        return result;
    }

    get isSSR(): boolean {
        return this._isSSR;
    }

    get isCSR(): boolean {
        return !this._isSSR;
    }

    get id(): string {
        return clone(this._id);
    }

    get memoKey(): string {
        return clone(this._memoKey);
    }

    public onChange<T>(observer: Observable<T>, onChange: ListenerFn<T>): void {
        this.observableSubscriptions.push(observer.onChange(onChange));
    }

    public addDependency<T extends LifeCycleManager>(token: InjectionToken<T>): T {
        const depObj = DependencyService.resolve(token);
        if (!hasLifeCycle(depObj)) {
            lifeCycleLog(
                `~~ ${getObjectName(this)} NOT Adding dependency`,
                getObjectName(depObj),
                `as it is not a LifeCycleManager`
            );
            return depObj as T;
        }
        this.dependencies.push(depObj);

        lifeCycleLog(
            `~~ ${getObjectName(this)} Adding dependency`,
            getObjectName(depObj),
            `DepList: [ ${this.dependencies.map((obj) => getObjectName(obj)).join(', ')} ]`
        );

        return depObj as T;
    }

    public removeDependency(token: InjectionToken<any>): void {
        const depObj = DependencyService.resolveSafe(token);
        if (!depObj) {
            throw new Error(`Unable to resolve ${String(token)}`);
        }

        if (this.dependencies.find((value) => value === depObj)) {
            if (hasLifeCycle(depObj)) {
                const end = get(depObj, 'end').bind(depObj);
                end();
            }

            pull(this.dependencies, depObj);
        }
    }

    protected async initializeDependencies(config?: any): Promise<Result<boolean, Error>> {
        lifeCycleLog(
            `~~~ ${getObjectName(this)}: Going to init: `,
            this.dependencies.map((obj) => getObjectName(obj)).join(', ')
        );
        /**
         * With this method, we're going to fail fast; if a dependency fails to init,
         * it really should be showstopper!
         */
        for (const dependency of this.dependencies) {
            if (hasLifeCycle(dependency)) {
                const result = await dependency.initialize(config);
                if (result.isErr()) {
                    lifeCycleErrorLog(`${getObjectName(this)}: Dependency ${getObjectName(dependency)} failed to initialize:`, result.error);
                    return result;
                }

                if (result.isOk() && !result.value) {
                    lifeCycleErrorLog(`${getObjectName(this)}: Dependency ${getObjectName(dependency)} initialization returned false`);
                    return result;
                }
            }
        }

        return ok(true);
    }

    protected async endDependencies(): Promise<Result<boolean, Error>> {
        lifeCycleLog(
            `~~~ ${getObjectName(this)}: Going to end: `,
            this.dependencies.map((obj) => getObjectName(obj)).join(', ')
        );

        /**
         * Here lets make sure to call 'end' on all the dependencies
         */
        const results: Array<Result<boolean, Error>> = [];
        for (const dependency of this.dependencies) {
            if (hasLifeCycle(dependency)) {
                const result = await dependency.end();
                if (result.isErr()) {
                    lifeCycleErrorLog(`${getObjectName(this)}: Dependency ${getObjectName(dependency)} failed to end:`, result.error);
                }
                results.push(result);
            }
        }

        const finalResult = results.reduce((previousValue, currentValue) => {
            if (previousValue.isErr() || (previousValue.isOk() && !previousValue.value))
                return previousValue;
            if (currentValue.isErr() || (currentValue.isOk() && !currentValue.value)) return currentValue;

            return currentValue;
        }, ok(true));

        if (!isResultTrue(finalResult)) {
            lifeCycleErrorLog(`${getObjectName(this)}: One or more dependencies failed to end properly`);
        }

        return finalResult;
    }
}