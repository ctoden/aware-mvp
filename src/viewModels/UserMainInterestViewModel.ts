import { injectable } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { ViewModel } from "./ViewModel";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { UserMainInterestService } from "../services/UserMainInterestService";
import { 
    UserMainInterest,
    UserMainInterestCreate,
    UserMainInterests,
    userMainInterests$,
    getUserMainInterestsArray
} from "../models/UserMainInterest";
import { observable } from "@legendapp/state";

@injectable()
export class UserMainInterestViewModel extends ViewModel {
    private readonly _userMainInterestService!: UserMainInterestService;

    readonly isEnabled$ = observable(false);

    constructor() {
        super('UserMainInterestViewModel');
        this._userMainInterestService = this.addDependency(UserMainInterestService);
    }

    get userMainInterests$() {
        return userMainInterests$;
    }

    isInterestSelected$(interest: string) {
        return observable(() => {
            const interests = userMainInterests$.get() as UserMainInterests | null;
            if (!interests) {
                return false;
            }

            const valueIsSelected = Object.values(interests).some(i => i.interest === interest);
            return valueIsSelected;
        });
    }

    protected async onInitialize?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.isEnabled$.set(getUserMainInterestsArray().length > 0);
        this.onChange(userMainInterests$, () => {
            this.isEnabled$.set(getUserMainInterestsArray().length > 0);
        });
        return BR_TRUE;
    }
    protected async onEnd?(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    getUserMainInterests(): UserMainInterest[] {
        return getUserMainInterestsArray();
    }

    async addUserMainInterest(interest: string): Promise<Result<UserMainInterest, Error>> {
        const newInterest: UserMainInterestCreate = {
            interest,
            user_id: '' // This will be set by the service
        };
        return await this._userMainInterestService.createUserMainInterest(newInterest);
    }

    async removeUserMainInterest(interest: string): Promise<Result<boolean, Error>> {
        console.log("~~~ Removing interest: ", interest);
        const interests = userMainInterests$.get() as UserMainInterests | null;
        if (!interests) return ok(false);
        
        console.log("~~~~ Got this far: ", interests);

        const interestToRemove = Object.values(interests).find(i => i.interest === interest);
        if (!interestToRemove) return ok(false);

        console.log("~~~~ Got this far: ", interestToRemove);
        return await this._userMainInterestService.deleteUserMainInterest(interestToRemove.id);
    }

    async refreshUserMainInterests(userId: string): Promise<Result<UserMainInterest[], Error>> {
        return await this._userMainInterestService.fetchUserMainInterests(userId);
    }
} 