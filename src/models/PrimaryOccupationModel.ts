import { observable } from "@legendapp/state";

export interface PrimaryOccupationModel {
    occupation: string;
}

export const primaryOccupation$ = observable<PrimaryOccupationModel>({
    occupation: ''
});

export function updateOccupation(occupation: string): void {
    primaryOccupation$.occupation.set(occupation);
} 