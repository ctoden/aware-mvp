import { observable } from "@legendapp/state";
import { familyStory$, updateStory } from "@src/models/FamilyStoryModel";
import { ViewModel } from "./ViewModel";
import { injectable } from "tsyringe";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result, err, ok } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { updateUserProfile, getUserProfile } from "@src/models/UserProfile";

@injectable()
export class FamilyStoryViewModel extends ViewModel {
    public readonly story$ = familyStory$.story;
    
    public readonly isValid$ = observable(() => 
        this.story$.get().trim().length > 0
    );

    constructor() {
        super('FamilyStoryViewModel');
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    public updateStory(story: string): void {
        updateStory(story);
    }

    public async saveStory(): Promise<Result<boolean, Error>> {
        const story = this.story$.get().trim();
        if (!story) {
            return ok(true);
        }

        const currentProfile = getUserProfile();
        if (!currentProfile) {
            return err(new Error('No user profile found'));
        }

        const success = updateUserProfile({
            family_story: story
        });

        return success ? ok(true) : err(new Error('Failed to update user profile'));
    }
}