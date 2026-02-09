import { observable } from '@legendapp/state';
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { Result } from "neverthrow";
import { injectable } from "tsyringe";
import { AuthService } from '../services/AuthService';
import { isValidEmail } from '../utils/EmailUtils';
import { ViewModel } from './ViewModel';
import { FtuxService } from '../services/FtuxService';
@injectable()
export class SignInViewModel extends ViewModel {
    private readonly _authService: AuthService;
    protected _ftuxService: FtuxService;

    email$ = observable<string>('');
    password$ = observable<string>('');
    isLoading$ = observable<boolean>(false);
    error$ = observable<string | null>(null);

    constructor() {
        super('SignInViewModel');
        this._authService = this.addDependency(AuthService);
        this._ftuxService = this.addDependency(FtuxService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        await this._ftuxService.setIntroCompleted(true);
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    async signIn(): Promise<void> {
        const email = this.email$.get();
        const password = this.password$.get();

        // Reset error state
        this.error$.set(null);

        // Validate email
        if (!isValidEmail(email)) {
            this.error$.set('Please enter a valid email address');
            return;
        }

        // Validate password
        if (!password) {
            this.error$.set('Password is required');
            return;
        }

        this.isLoading$.set(true);

        try {
            const ftuxCompleted = this._ftuxService.isFtuxCompleted();
            this._ftuxService.setIntroCompleted(true);
            this._ftuxService.setCurrentStep(2);
            this._ftuxService.setFtuxCompleted(true);
            const result = await this._authService.signIn(email, password);
            if (result.isErr()) {
                this._ftuxService.setFtuxCompleted(ftuxCompleted);
                this.error$.set(result.error.message);
                return;
            }
            this.clearForm();
        } finally {
            this.isLoading$.set(false);
        }
    }

    clearForm(): void {
        this.email$.set('');
        this.password$.set('');
        this.error$.set(null);
    }
} 