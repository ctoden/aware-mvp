import { DependencyService } from "@src/core/injection/DependencyService";
import { InjectCtor } from "@src/core/injection/Injectable";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { getHash } from "@src/utils/HashUtils";

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

// Cache ViewModels by constructor reference to avoid minified class name collisions.
// Using a Map keyed by constructor ensures each ViewModel type gets its own cached instance,
// even when class names are minified to the same string (e.g., "t") in production builds.
const viewModelCache = new Map<Function, any>();

function getOrCreateViewModel(ctor: InjectCtor<any>, ...args: any[]) {
    const cacheKey = ctor; // Use constructor reference as key — unique per class
    if (viewModelCache.has(cacheKey)) {
        return viewModelCache.get(cacheKey);
    }
    const vm = DependencyService.resolve(ctor);
    viewModelCache.set(cacheKey, vm);
    return vm;
}

async function _initializeViewModel<T extends ViewModel>(vm: T, ...args: any[]): Promise<T> {
    if (vm && vm.initialize) {
        await vm.initialize(...args);
    }
    return vm;
}

// Cache initialization by the ViewModel's own name property (set in constructor via super(name)),
// NOT by constructor.name which gets minified in production builds.
const initCache = new Map<string, Promise<any>>();
export const initializeViewModel = async function<T extends ViewModel>(vm: T, ...args: any[]): Promise<T> {
    const key = getHash([vm.name, ...args]);
    if (initCache.has(key)) {
        return initCache.get(key)!;
    }
    const promise = _initializeViewModel(vm, ...args);
    initCache.set(key, promise);
    return promise;
};

export async function withViewModel<T extends ViewModel>(ctor: InjectCtor<T>, ...args: any[]): Promise<T> {
    return initializeViewModel(getOrCreateViewModel(ctor, ...args), ...args);
}

export function getViewModel<T extends ViewModel>(ctor: InjectCtor<T>, ...args: any[]): T {
    return getOrCreateViewModel(ctor, ...args);
}