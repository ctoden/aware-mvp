import { observable } from "@legendapp/state";

export interface UserQuickInsight {
    id: string;
    user_id: string;
    title: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

export const userQuickInsights$ = observable<UserQuickInsight[]>([]);

export function addQuickInsight(insight: UserQuickInsight): void {
    userQuickInsights$.set((prev) => [...prev, insight]);
}

export function removeQuickInsight(id: string): void {
    userQuickInsights$.set((prev) => prev.filter((insight) => insight.id !== id));
}

export function updateQuickInsight(id: string, updates: Partial<UserQuickInsight>): void {
    userQuickInsights$.set((prev) =>
        prev.map((insight) =>
            insight.id === id ? { ...insight, ...updates, updated_at: new Date() } : insight
        )
    );
}

export function clearQuickInsights(): void {
    userQuickInsights$.set([]);
} 