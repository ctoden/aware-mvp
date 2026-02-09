import { Result } from "neverthrow";
import { UserWeakness, WeaknessType } from "@src/models/UserWeakness";

// Define the CoreValue interface used by WeaknessesService
export interface IWeakness {
    title: string;
    description: string;
}

export interface WeaknessesActionService {
    clearWeaknesses(): Promise<Result<boolean, Error>>;
    createWeakness(value: IWeakness, type?: WeaknessType): Promise<Result<UserWeakness, Error>>;
    createWeaknesses(values: IWeakness[], type?: WeaknessType): Promise<Result<UserWeakness[], Error>>;
    updateWeakness(id: string, updates: Partial<IWeakness>): Promise<Result<UserWeakness, Error>>;
    deleteWeakness(id: string): Promise<Result<boolean, Error>>;
    fetchUserWeaknesses(userId: string): Promise<Result<UserWeakness[], Error>>;
} 