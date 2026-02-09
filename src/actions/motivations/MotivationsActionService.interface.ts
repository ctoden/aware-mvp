import { Result } from "neverthrow";
import { IMotivation, MotivationType, UserMotivation } from "@src/models/UserMotivation";

export interface MotivationsActionService {
    clearMotivations(): Promise<Result<boolean, Error>>;
    createMotivation(value: IMotivation, type?: MotivationType): Promise<Result<UserMotivation, Error>>;
    createMotivations(values: IMotivation[], type?: MotivationType): Promise<Result<UserMotivation[], Error>>;
    fetchUserMotivations(userId: string): Promise<Result<UserMotivation[], Error>>;
} 