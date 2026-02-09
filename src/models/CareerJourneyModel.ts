import { observable } from "@legendapp/state";

export interface CareerJourneyEntry {
    id: string;
    journey: string;
}

export const careerJourneyEntries$ = observable<CareerJourneyEntry[]>([]);

export function addCareerJourneyEntry(): void {
    careerJourneyEntries$.set((prev) => [
        ...prev,
        { id: Math.random().toString(), journey: '' }
    ]);
}

export function updateCareerJourneyEntry(id: string, journey: string): void {
    careerJourneyEntries$.set((prev) => 
        prev.map(entry => 
            entry.id === id 
                ? { ...entry, journey }
                : entry
        )
    );
}

export function removeCareerJourneyEntry(id: string): void {
    careerJourneyEntries$.set((prev) => prev.filter(entry => entry.id !== id));
}

export function clearCareerJourneyEntries(): void {
    careerJourneyEntries$.set([]);
} 