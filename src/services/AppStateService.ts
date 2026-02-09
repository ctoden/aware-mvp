import { singleton } from 'tsyringe';
import { Result, err, ok } from 'neverthrow';
import { Service } from './Service';
import { LifeCycleConfig } from '@src/core/lifecycle/LifeCycleManager';
import { APP_STATE_PROVIDER_KEY, IAppStateProvider } from '@src/providers/appstate/AppStateProvider';
import { DependencyService } from '@src/core/injection/DependencyService';
import { appState$ } from '@src/models/AppStateModel';

@singleton()
export class AppStateService extends Service {
    private static _instance: AppStateService;
    private _appStateProvider: IAppStateProvider | null = null;

    constructor() {
        super('AppStateService');
        if (AppStateService._instance) {
            return AppStateService._instance;
        }
        AppStateService._instance = this;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        // Get the app state provider
        this._appStateProvider = DependencyService.resolveSafe(APP_STATE_PROVIDER_KEY);
        if (!this._appStateProvider) {
            return err(new Error('No app state provider registered'));
        }

        // Set initial state
        appState$.set(this._appStateProvider.getCurrentState());

        // Subscribe to app state changes
        const subscription = this._appStateProvider.onAppStateChange((state) => {
            console.log(`~~~ AppState changed to ${state}`);
            if (state === 'active') {
                console.log("~~~ App is now active - restoring from background");
            } else if (state === 'background') {
                console.log("~~~ App is going to background - preserving state");
            }
            appState$.set(state);
        });

        this.observableSubscriptions.push(subscription.remove);

        return ok(true);
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }


} 