import { observable } from '@legendapp/state';
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { FtuxService } from '@src/services/FtuxService';
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { isValidPhoneNumber } from '@src/utils/PhoneNumberUtils';
import { isEmpty } from 'lodash';
import { Result, err, ok } from "neverthrow";
import { injectable } from "tsyringe";
import { AuthService } from "../services/AuthService";
import { isValidEmail } from '../utils/EmailUtils';
import { ViewModel } from './ViewModel';

@injectable()
export class SignUpViewModel extends ViewModel {
    private readonly _authService: AuthService;
    private readonly _ftuxService: FtuxService;
    email$ = observable<string>('');
    password$ = observable<string>('');
    confirmPassword$ = observable<string>('');
    fullName$ = observable<string>('');
    phoneNumber$ = observable<string>('');
    isLoading$ = observable<boolean>(false);
    error$ = observable<string | null>(null);

    constructor() {
        super('SignUpViewModel');
        this._authService = this.addDependency(AuthService);
        this._ftuxService = this.addDependency(FtuxService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        const result = await this._ftuxService.setIntroCompleted(true);
        if (result.isErr()) {
            return err(result.error);
        }
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    /**
     * Clears all form fields and resets to default values
     */
    clearForm(): void {
        this.email$.set('');
        this.password$.set('');
        this.confirmPassword$.set('');
        this.fullName$.set('');
        this.phoneNumber$.set('');
        this.error$.set(null);
    }

    validate(): Result<true, Error> {
        const email = this.email$.get();
        const password = this.password$.get();
        const confirmPassword = this.confirmPassword$.get();
        const fullName = this.fullName$.get();
        const phoneNumber = this.phoneNumber$.get();
        // Reset error state
        this.error$.set(null);

        // Validate required fields
        if (!fullName.trim()) {
            this.error$.set('Full Name is required');
            return err(new Error('Full Name is required'));
        }

        // Validate email
        if (!isValidEmail(email)) {
            this.error$.set('Please enter a valid email address');
            return err(new Error('Please enter a valid email address'));
        }

        if (!isEmpty(phoneNumber) && !isValidPhoneNumber(phoneNumber)) {
            this.error$.set('Please enter a valid phone number');
            return err(new Error('Please enter a valid phone number'));
        }

        // Validate password
        if (password.length < 6) {
            this.error$.set('Password must be at least 6 characters long');
            return err(new Error('Password must be at least 6 characters long'));
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
            this.error$.set('Passwords do not match');
            return err(new Error('Passwords do not match'));
        }

        return ok(true);
    }

    async signUp(): Promise<Result<true, Error>> {
        const validationResult = this.validate();
        if (validationResult.isErr()) {
            this.error$.set(validationResult.error.message);
            return err(validationResult.error);
        }

        this.isLoading$.set(true);
        this.error$.set(null);

        try {
            const result = await this._authService.signUp(
                this.email$.get(),
                this.password$.get(),
                {
                    fullName: this.fullName$.get(),
                    phoneNumber: this.phoneNumber$.get()
                }
            );

            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }

            this._ftuxService.setFtuxCompleted(false);
            // Clear form fields after successful sign-up
            this.clearForm();
            return ok(true);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            this.error$.set(errorMessage);
            return err(error instanceof Error ? error : new Error(errorMessage));
        } finally {
            this.isLoading$.set(false);
        }
    }
}