import { AppStateStatus } from 'react-native';
import { singleton } from 'tsyringe';
import { Result } from 'neverthrow';
import { ObservableLifecycleManager } from '@src/core/lifecycle/ObservableLifecycleManager';
import { IAppStateProvider, AppStateChangeCallback } from './AppStateProvider';
import { BR_TRUE } from '@src/utils/NeverThrowUtils';

@singleton()
export class TestAppStateProvider extends ObservableLifecycleManager implements IAppStateProvider {
    private static _instance: TestAppStateProvider;
    private _currentState: AppStateStatus = 'active';
    private _callbacks: Set<AppStateChangeCallback> = new Set();
    name = 'TestAppStateProvider';

    constructor() {
        super();
        if (TestAppStateProvider._instance) {
            return TestAppStateProvider._instance;
        }
        TestAppStateProvider._instance = this;
    }

    getCurrentState(): AppStateStatus {
        return this._currentState;
    }

    // Test helper method
    setState(state: AppStateStatus): void {
        this._currentState = state;
        this._callbacks.forEach(callback => callback(state));
    }

    onAppStateChange(callback: AppStateChangeCallback): { remove: () => void } {
        this._callbacks.add(callback);
        return {
            remove: () => {
                this._callbacks.delete(callback);
            }
        };
    }

    protected async onInitialize?(): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(): Promise<Result<boolean, Error>> {
        this._callbacks.clear();
        return BR_TRUE;
    }
} 