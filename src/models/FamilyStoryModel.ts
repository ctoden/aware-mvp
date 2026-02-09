import { observable } from "@legendapp/state";

export interface FamilyStoryData {
    story: string;
}

export const familyStory$ = observable<FamilyStoryData>({
    story: ''
});

export function updateStory(story: string): void {
    familyStory$.story.set(story);
} 