import { observable } from "@legendapp/state";
import { ViewModel } from "./ViewModel";
import { injectable } from "tsyringe";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result, ok, err } from "neverthrow";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { AvatarData, avatar$, setAvatar, clearAvatar } from "@src/models/AvatarModel";
import { updateUserProfile } from "@src/models/UserProfile";
import { createEmojiAvatarUrl } from "@src/utils/AvatarUtils";

@injectable()
export class AvatarViewModel extends ViewModel {
    public readonly avatar$ = avatar$;
    public readonly isValid$ = observable(() => !!this.avatar$.get().emoji);

    constructor() {
        super('AvatarViewModel');
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    public updateAvatar(emoji: string): void {
        setAvatar(emoji);
    }

    public clearAvatar(): void {
        clearAvatar();
    }

    async saveAvatar(): Promise<Result<boolean, Error>> {
        try {
            const emoji = this.avatar$.get().emoji;
            if (!emoji) {
                return err(new Error('No avatar emoji set'));
            }

            const success = updateUserProfile({
                avatar_url: createEmojiAvatarUrl(emoji)
            });

            if (!success) {
                return err(new Error('Failed to update avatar'));
            }

            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Unknown error occurred'));
        }
    }
}

// Create singleton instance
export const avatarViewModel = new AvatarViewModel(); 