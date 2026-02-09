import {Result} from "neverthrow";
import {AuthError} from "@supabase/supabase-js";
import {SignUpData} from "@src/types/SignUpData";

export const AUTH_PROVIDER_KEY = 'IAuthProvider';

export type AuthUser = {
    id: string;
    email?: string;
    fullName?: string;
    username?: string;
};

export type AuthSession = {
    access_token: string;
    user: AuthUser | null;
};

export type AuthResponseData = {
    user: AuthUser | null;
    session: AuthSession | null;
};

export type AuthStateChangeCallback = (session: AuthSession | null) => void;

export type AuthSubscription = {
    unsubscribe: () => void;
};

export interface IAuthProvider {
    signUp(email: string, password: string, userData: SignUpData): Promise<Result<AuthResponseData, AuthError>>;
    signIn(email: string, password: string): Promise<Result<AuthResponseData, AuthError>>;
    signOut(): Promise<Result<boolean, AuthError>>;
    getSession(): Promise<Result<AuthSession | null, AuthError>>;
    startAutoRefresh(): Promise<void>;
    stopAutoRefresh(): Promise<void>;
    onAuthStateChange(callback: AuthStateChangeCallback): { data: { subscription: AuthSubscription } };
    initialize(): Promise<Result<boolean, Error>>;
    end(): Promise<Result<boolean, Error>>;
} 