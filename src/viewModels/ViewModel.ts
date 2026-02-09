import { DependencyService } from "@src/core/injection/DependencyService";
import { InjectCtor } from "@src/core/injection/Injectable";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { getHash } from "@src/utils/HashUtils";
import { memoize } from "lodash";

export abstract class ViewModel extends ObservableLifecycleManager {
  topQualities: any;
    loadTopQualities() {
      throw new Error('Method not implemented.');
    }
    readonly name: string;
    isLoading$: any;
    error$: any;
  topQualities: any;
  isLoading: any;
  error: Error | undefined;

    protected constructor(name: string) {
        super();
        this.name = name;
    }
}

// Update createViewModel to be an async function that awaits vm.initialize()
function createViewModel(ctor: InjectCtor<any>, ...args: any[]) {
    return DependencyService.resolve(ctor);
}

// Create a memoized version of createViewModel using a custom hash function
const memoizedCreateViewModel = memoize(
    createViewModel,
    (ctor: InjectCtor<any>, ...args: any[]) => {
        return getHash([ctor.name, ...args]);
    });

async function _initializeViewModel<T extends ViewModel>(vm: T, ...args: any[]): Promise<T> {
    if (vm && vm.initialize) {
        await vm.initialize(...args);
    }
    return vm;
}

// TODO: add a hash value to the ViewModel so we don't have to compute it every time if we already have
export const initializeViewModel = memoize(
    _initializeViewModel,
    (vm: ViewModel, ...args: any[]) => {
        return getHash([vm.constructor.name, ...args]);
    });

export async function withViewModel<T extends ViewModel>(ctor: InjectCtor<T>, ...args: any[]): Promise<T> {
    // const vm = memoizedCreateViewModel(ctor, ...args);
    // if (vm && vm.initialize) {
    //     await vm.initialize(...args);
    // }
    return initializeViewModel(memoizedCreateViewModel(ctor, ...args), ...args);
}

export function getViewModel<T extends ViewModel>(ctor: InjectCtor<T>, ...args: any[]): T {
    return memoizedCreateViewModel(ctor, ...args);
}