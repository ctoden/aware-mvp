import { observable } from "@legendapp/state";
import { Nilable } from "@src/core/types/Nullable";

export interface ProfessionalDevelopment {
    id: string;
    user_id: string;
    key_terms: string[];
    description: string;
    leadership_style_title: string;
    leadership_style_description: string;
    goal_setting_style_title: string;
    goal_setting_style_description: string;
    created_at: string;
    updated_at: string;
}

// Create the observable state
export const professionalDevelopment$ = observable<Nilable<ProfessionalDevelopment>>(null);

// Helper functions to interact with the data
export function getProfessionalDevelopment(): Nilable<ProfessionalDevelopment> {
    return professionalDevelopment$.peek();
}

export function setProfessionalDevelopment(value: ProfessionalDevelopment | null): void {
    professionalDevelopment$.set(value);
}

export function updateProfessionalDevelopment(updates: Partial<ProfessionalDevelopment>): void {
    const current = professionalDevelopment$.peek();
    if (current) {
        professionalDevelopment$.set({
            ...current,
            ...updates,
            updated_at: new Date().toISOString()
        });
    }
}

export function clearProfessionalDevelopment(): void {
    professionalDevelopment$.set(null);
} 