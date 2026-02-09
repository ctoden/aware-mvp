import { topQualityColors } from "@app/constants/theme";
import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";
import { Colors } from "react-native-ui-lib";
import { camelCase, cloneDeep } from "lodash";

export interface IUserTopQuality {
    title: string;
    level: string;
    description: string;
    score: number;
    color: string;
}

export interface UserTopQuality extends IUserTopQuality {
    id: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

export interface UserTopQualities {
    [key: string]: UserTopQuality;
}

// Create the observable state
export const userTopQualities$ = observable<Nilable<UserTopQualities>>(null);

// Helper function to get qualities as an array
export function getUserTopQualitiesArray(): UserTopQuality[] {
    const qualities = userTopQualities$.peek();
    if (!qualities) return [];
    return Object.values(qualities);
}

// Helper function to get qualities count
export function getTopQualitiesCount(): number {
    return getUserTopQualitiesArray().length;
}

// Helper function to find a quality by title
export function findQualityByTitle(title: string): UserTopQuality | undefined {
    const qualities = getUserTopQualitiesArray();
    return qualities.find(quality => quality.title === title);
}

// Helper function to update or add a quality
export function upsertQuality(quality: UserTopQuality): void {
    const qualities = cloneDeep(userTopQualities$.peek() ?? {});
    qualities[quality.id] = quality;
    userTopQualities$.set(qualities);
}

// Helper function to remove a quality
export function removeQuality(id: string): void {
    const qualities = userTopQualities$.peek();
    if (!qualities) return;
    
    const newQualities = { ...qualities };
    delete newQualities[id];
    userTopQualities$.set(newQualities);
}

// Helper function to remove all qualities
export function clearQualities(): void {
    userTopQualities$.set(null);
}
// Helper function to set quality level based on score
export function setQualityLevel(quality: UserTopQuality): void {
    const score = quality.score;
    
    if (score >= 9) {
        quality.level = "Highest";
    } else if (score >= 8) {
        quality.level = "Very High"; 
    } else if (score >= 7) {
        quality.level = "High";
    } else if (score >= 5) {
        quality.level = "Medium";
    } else if (score >= 4) {
        quality.level = "Low";
    } else if (score >= 2) {
        quality.level = "Very Low";
    } else {
        quality.level = "Lowest";
    }
}

export function getQualityColor(quality: UserTopQuality): string {
    const title = camelCase(quality.title);
    return topQualityColors[title as keyof typeof topQualityColors] || Colors.$textDefault;
}

export function setQualityColor(quality: UserTopQuality): void {
    quality.color = getQualityColor(quality);
}
