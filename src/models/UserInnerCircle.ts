import { observable } from "@legendapp/state";

export interface UserInnerCircle {
    id: string;
    user_id: string;
    name: string;
    relationship_type: string;
    created_at: Date;
    updated_at: Date;
}

export const userInnerCircle$ = observable<UserInnerCircle[]>([]);

export function addInnerCircleMember(member: UserInnerCircle): void {
    userInnerCircle$.set((prev) => [...prev, member]);
}

export function removeInnerCircleMember(id: string): void {
    userInnerCircle$.set((prev) => prev.filter((member) => member.id !== id));
}

export function updateInnerCircleMember(id: string, updates: Partial<UserInnerCircle>): void {
    userInnerCircle$.set((prev) =>
        prev.map((member) =>
            member.id === id ? { ...member, ...updates, updated_at: new Date() } : member
        )
    );
}

export function clearInnerCircle(): void {
    userInnerCircle$.set([]);
} 