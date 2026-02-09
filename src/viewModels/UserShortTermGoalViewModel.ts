import { Result, ok } from "neverthrow";
import { ViewModel } from "./ViewModel";
import { UserShortTermGoalService } from "@src/services/UserShortTermGoalService";
import { UserShortTermGoal, getUserShortTermGoalsArray } from "@src/models/UserShortTermGoal";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { injectable } from "tsyringe";

@injectable()
export class UserShortTermGoalViewModel extends ViewModel {
    private readonly _userShortTermGoalService!: UserShortTermGoalService;

    constructor() {
        super('UserShortTermGoalViewModel');
        this._userShortTermGoalService = this.addDependency(UserShortTermGoalService);
    }

    protected async onInitialize(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async onEnd(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    getUserShortTermGoals(): UserShortTermGoal[] {
        return getUserShortTermGoalsArray();
    }

    async addUserShortTermGoal(goal: string): Promise<Result<UserShortTermGoal, Error>> {
        return await this._userShortTermGoalService.createUserShortTermGoal(goal);
    }

    async updateUserShortTermGoal(id: string, goal: string): Promise<Result<UserShortTermGoal, Error>> {
        return await this._userShortTermGoalService.updateUserShortTermGoal(id, goal);
    }

    async deleteUserShortTermGoal(id: string): Promise<Result<boolean, Error>> {
        return await this._userShortTermGoalService.deleteUserShortTermGoal(id);
    }
} 