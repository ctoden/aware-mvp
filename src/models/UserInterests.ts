import { observable } from '@legendapp/state';

export interface UserInterests {
    id: string;
    summary: string;
    created_at: string;
    updated_at: string;
    user_id: string;
}

export const userInterests$ = observable<UserInterests | null>(null);