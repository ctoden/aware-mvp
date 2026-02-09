import { Result, ok } from "neverthrow";
import { ViewModel } from "./ViewModel";
import { UserLongTermGoalService } from "@src/services/UserLongTermGoalService";
import { UserLongTermGoal, getUserLongTermGoalsArray } from "@src/models/UserLongTermGoal";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { injectable } from "tsyringe";

@injectable()
export class UserLongTermGoalViewModel extends ViewModel {
    private readonly _userLongTermGoalService!: UserLongTermGoalService;

    constructor() {
        super('UserLongTermGoalViewModel');
        this._userLongTermGoalService = this.addDependency(UserLongTermGoalService);
    }

    protected async onInitialize(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async onEnd(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    getUserLongTermGoals(): UserLongTermGoal[] {
        return getUserLongTermGoalsArray();
    }

    async addUserLongTermGoal(goal: string): Promise<Result<UserLongTermGoal, Error>> {
        return await this._userLongTermGoalService.createUserLongTermGoal(goal);
    }

    async updateUserLongTermGoal(id: string, goal: string): Promise<Result<UserLongTermGoal, Error>> {
        return await this._userLongTermGoalService.updateUserLongTermGoal(id, goal);
    }

    async deleteUserLongTermGoal(id: string): Promise<Result<boolean, Error>> {
        return await this._userLongTermGoalService.deleteUserLongTermGoal(id);
    }
} 