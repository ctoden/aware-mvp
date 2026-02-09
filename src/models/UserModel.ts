import { UserIdentityModel } from "./UserIdentityModel";

export interface UserModel {
    id: string;
    app_metadata: Record<string, any>;
    user_metadata: Record<string, any>;
    aud: string;
    confirmation_sent_at?: string;
    recovery_sent_at?: string;
    email_change_sent_at?: string;
    invited_at?: string;
    action_link?: string;
    email?: string;
    phone?: string;
    created_at: string;
    confirmed_at?: string;
    email_confirmed_at?: string;
    phone_confirmed_at?: string;
    last_sign_in_at?: string;
    role?: string;
    updated_at?: string;
    identities?: UserIdentityModel[];
}