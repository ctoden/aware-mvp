import { Result } from "neverthrow";
import { UserCoreValue } from "@src/models/UserCoreValue";

export interface ICoreValuesService {
    fetchUserCoreValues(userId: string): Promise<Result<UserCoreValue[], Error>>;
    createCoreValue(value: Omit<UserCoreValue, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Result<UserCoreValue, Error>>;
    updateCoreValue(id: string, updates: Partial<Omit<UserCoreValue, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<Result<UserCoreValue, Error>>;
    deleteCoreValue(id: string): Promise<Result<boolean, Error>>;
    clearCoreValues(): Promise<Result<boolean, Error>>;
} 