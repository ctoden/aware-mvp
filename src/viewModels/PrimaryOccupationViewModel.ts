import { observable } from "@legendapp/state";
import { primaryOccupation$, updateOccupation } from "@src/models/PrimaryOccupationModel";
import { ViewModel } from "./ViewModel";
import { injectable } from "tsyringe";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result, err, ok } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { updateUserProfile, getUserProfile } from "@src/models/UserProfile";

@injectable()
export class PrimaryOccupationViewModel extends ViewModel {
    public readonly occupation$ = primaryOccupation$.occupation;
    
    public readonly isValid$ = observable(() => 
        this.occupation$.get().trim().length > 0
    );

    constructor() {
        super('PrimaryOccupationViewModel');
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    public updateOccupation(occupation: string): void {
        updateOccupation(occupation);
    }

    public async saveOccupation(): Promise<Result<boolean, Error>> {
        const occupation = this.occupation$.get().trim();
        if (!occupation) {
            return ok(true);
        }

        const currentProfile = getUserProfile();
        if (!currentProfile) {
            return err(new Error('No user profile found'));
        }

        const success = updateUserProfile({
            primary_occupation: occupation
        });

        return success ? ok(true) : err(new Error('Failed to update user profile'));
    }
} 