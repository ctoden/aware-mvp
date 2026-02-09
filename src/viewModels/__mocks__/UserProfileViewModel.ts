import { observable } from '@legendapp/state';
import { ok } from 'neverthrow';
import type { UserProfile } from '@src/models/UserProfile';

const mockUserProfile: UserProfile = {
  id: '1',
  full_name: 'Kate Smith',
  phone_number: '+1234567890',
  avatar_url: null,
  summary: 'You are a truly independent and inquisitive person...',
  website: null,
  updated_at: null
};

export const UserProfileViewModel = jest.fn().mockImplementation(() => ({
  userProfile$: observable<UserProfile | null>(mockUserProfile),
  formState$: observable({
    fullName: 'Kate Smith',
    phoneNumber: '+1234567890'
  }),
  onInitialize: jest.fn().mockResolvedValue(ok(true))
}));
