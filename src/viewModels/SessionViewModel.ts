import {observable} from '@legendapp/state';
import {ViewModel} from './ViewModel';
import {injectable} from "tsyringe";
import {DependencyService} from "@src/core/injection/DependencyService";
import {AuthResponseData} from '../providers/auth/AuthProvider';
import {AuthService} from '../services/AuthService';
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {Result} from "neverthrow";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";

@injectable()
export class SessionViewModel extends ViewModel {
    private readonly _authService: AuthService;

    isLoading$ = observable<boolean>(false);
    error$ = observable<string | null>(null);

    constructor() {
        super('SessionViewModel');
        this._authService = this.addDependency(AuthService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    async signOut(): Promise<void> {
        this.isLoading$.set(true);
        this.error$.set(null);

        try {
            const result = await this._authService.signOut();
            if (result.isErr()) {
                this.error$.set(result.error.message);
            }
        } finally {
            this.isLoading$.set(false);
        }
    }

    async getSession(): Promise<AuthResponseData | null> {
        const result = await this._authService.getSession();
        if (result.isErr()) {
            this.error$.set(result.error.message);
            return null;
        }
        return result.value;
    }
} 