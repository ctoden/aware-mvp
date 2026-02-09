import {observable} from '@legendapp/state';
import {ViewModel} from './ViewModel';
import {AuthService} from '../services/AuthService';
import {AppStateService} from '../services/AppStateService';
import {injectable} from "tsyringe";
import {DependencyService} from "@src/core/injection/DependencyService";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {err, ok, Result} from "neverthrow";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";
import {appState$} from '@src/models/AppStateModel';
import {AppStateStatus} from 'react-native';

@injectable()
export class AppStateViewModel extends ViewModel {
    private readonly _authService: AuthService;
    private readonly _appStateService: AppStateService;

    constructor() {
        super('AppStateViewModel');
        this._authService = this.addDependency(AuthService);
        this._appStateService = this.addDependency(AppStateService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    // Accessor for appState$ model
    get appState(): AppStateStatus {
        return appState$.get();
    }

    // Observable accessor for components that need to observe changes
    get appState$() {
        return appState$;
    }
} 