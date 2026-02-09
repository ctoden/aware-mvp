import { observable } from "@legendapp/state";

export interface CareerHistoryEntry {
    id: string;
    user_id: string;
    position_text: string;
    created_at: Date;
    updated_at: Date;
}

export const careerHistory$ = observable<CareerHistoryEntry[]>([]);

export function addCareerHistoryEntry(entry: CareerHistoryEntry): void {
    careerHistory$.set((prev) => [...prev, entry]);
}

export function updateCareerHistoryEntry(id: string, positionText: string): void {
    careerHistory$.set((prev) => 
        prev.map(entry => 
            entry.id === id 
                ? { ...entry, position_text: positionText, updatedAt: new Date() }
                : entry
        )
    );
}

export function removeCareerHistoryEntry(id: string): void {
    careerHistory$.set((prev) => prev.filter(entry => entry.id !== id));
}

export function clearCareerHistory(): void {
    careerHistory$.set([]);
} 