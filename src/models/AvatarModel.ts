import { observable } from "@legendapp/state";

export interface AvatarData {
    emoji: string;
}

export const avatar$ = observable<AvatarData>({
    emoji: ''
});

// Helper functions for data manipulation
export function setAvatar(emoji: string): void {
    avatar$.set({ emoji });
}

export function clearAvatar(): void {
    avatar$.set({ emoji: '' });
} 