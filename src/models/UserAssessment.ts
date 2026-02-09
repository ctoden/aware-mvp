import { observable } from '@legendapp/state';
import { Database } from './database.types';

export type UserAssessment = Database['public']['Tables']['user_assessments']['Row'];
export const userAssessments$ = observable<UserAssessment[]>([]);
