import { Session, User } from '@supabase/supabase-js';
import { SessionModel } from '@src/models/SessionModel';

export const createMockSupabaseSession = (): Session => ({
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600,
  refresh_token: 'mock-refresh-token',
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    identities: [{
      id: 'test-identity-id',
      user_id: 'test-user-id',
      identity_data: {},
      provider: 'email',
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString()
    }]
  } as User
} as Session);

export const createMockSessionModel = (): SessionModel => ({
  access_token: 'mock-access-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600,
  refresh_token: 'mock-refresh-token',
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    role: 'authenticated',
    identities: [{
      id: 'test-identity-id',
      user_id: 'test-user-id',
      identity_data: {},
      provider: 'email',
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString()
    }]
  }
}); 