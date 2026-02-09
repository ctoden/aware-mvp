import { observable } from '@legendapp/state';

export interface UserGoals {
    id: string;
    summary: string;
    created_at: string;
    updated_at: string;
    user_id: string;
}

export const userGoals$ = observable<UserGoals | null>(null);