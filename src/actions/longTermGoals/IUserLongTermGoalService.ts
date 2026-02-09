import { Result } from "neverthrow";
import { UserLongTermGoal } from "@src/models/UserLongTermGoal";

export interface IUserLongTermGoalService {
    fetchUserLongTermGoals(userId: string): Promise<Result<UserLongTermGoal[], Error>>;
    createUserLongTermGoal(goal: string): Promise<Result<UserLongTermGoal, Error>>;
    updateUserLongTermGoal(goalId: string, goal: string): Promise<Result<UserLongTermGoal, Error>>;
    deleteUserLongTermGoal(goalId: string): Promise<Result<boolean, Error>>;
} 