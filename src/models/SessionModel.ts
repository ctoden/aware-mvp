import { UserModel } from "./UserModel";
import {observable} from "@legendapp/state";

export interface SessionModel {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    expires_at?: number;
    token_type: string;
    provider_token?: string;
    provider_refresh_token?: string;
    user: UserModel | null;
  }

export const session$ = observable<SessionModel | null>(null);
export const user$ = observable<UserModel | null>(null);

export const isAuthenticated$ = observable(() => {
    console.log('\n\n ~~~~~~ isAuthenticated -- isAuthenticated$ ', session$.get(), "\n\n");
    return !!session$.get();
});
