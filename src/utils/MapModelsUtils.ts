import { Session, User, UserIdentity } from '@supabase/supabase-js';
import { SessionModel } from '../models/SessionModel';
import { UserModel } from '../models/UserModel';
import { UserIdentityModel } from '../models/UserIdentityModel';

export function mapSession(session: Session): SessionModel {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token ?? undefined,
    expires_in: session.expires_in ?? undefined,
    expires_at: session.expires_at ?? undefined,
    token_type: session.token_type,
    provider_token: session.provider_token ?? undefined,
    provider_refresh_token: session.provider_refresh_token ?? undefined,
    user: session.user ? mapUser(session.user) : null,
  };
}

export function mapUser(user: User): UserModel {
  return {
    id: user.id,
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
    aud: user.aud,
    confirmation_sent_at: user.confirmation_sent_at ?? undefined,
    recovery_sent_at: user.recovery_sent_at ?? undefined,
    email_change_sent_at: user.email_change_sent_at ?? undefined,
    invited_at: user.invited_at ?? undefined,
    action_link: user.action_link ?? undefined,
    email: user.email ?? undefined,
    phone: user.phone ?? undefined,
    created_at: user.created_at,
    confirmed_at: user.confirmed_at ?? undefined,
    email_confirmed_at: user.email_confirmed_at ?? undefined,
    phone_confirmed_at: user.phone_confirmed_at ?? undefined,
    last_sign_in_at: user.last_sign_in_at ?? undefined,
    role: user.role ?? undefined,
    updated_at: user.updated_at ?? undefined,
    identities: user.identities ? user.identities.map(mapUserIdentity) : undefined,
  };
}

export function mapUserIdentity(identity: UserIdentity): UserIdentityModel {
  return {
    id: identity.id,
    user_id: identity.user_id,
    identity_data: identity.identity_data ?? {},
    provider: identity.provider,
    created_at: identity.created_at ?? '',
    last_sign_in_at: identity.last_sign_in_at ?? '',
    updated_at: identity.updated_at ?? undefined,
  };
}