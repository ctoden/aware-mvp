import { observable } from "@legendapp/state";
import { Result, err } from "neverthrow";
import { injectable } from "tsyringe";
import { ViewModel } from "./ViewModel";
import { UserInnerCircle, userInnerCircle$ } from "@src/models/UserInnerCircle";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { UserInnerCircleService } from "@src/services/UserInnerCircleService";

@injectable()
export class UserInnerCircleViewModel extends ViewModel {
    public readonly innerCircle$ = userInnerCircle$;
    public readonly newMemberName$ = observable<string>("");
    public readonly newMemberRelationType$ = observable<string>("");
    public readonly isLoading$ = observable<boolean>(false);
    public readonly error$ = observable<string>("");

    private readonly _innerCircleService: UserInnerCircleService;

    constructor() {
        super("UserInnerCircleViewModel");
        this._innerCircleService = this.addDependency(UserInnerCircleService);
    }

    public async onInitialize(config?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if (!config?.userId) {
            console.warn("~~~ UserInnerCircleViewModel: User ID is required");
            return BR_TRUE;
        }

        this.loadInnerCircle(config.userId);

        return BR_TRUE;
    }

    protected async onEnd(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    private async loadInnerCircle(userId: string): Promise<Result<boolean, Error>> {
        this.isLoading$.set(true);
        this.error$.set("");

        try {
            const result = await this._innerCircleService.fetchUserInnerCircle(userId);
            this.isLoading$.set(false);
            
            if (result.isErr()) {
                this.error$.set(result.error.message);
                return err(result.error);
            }
            
            return BR_TRUE;
        } catch (error) {
            this.isLoading$.set(false);
            this.error$.set(error instanceof Error ? error.message : "Unknown error occurred");
            return err(error instanceof Error ? error : new Error("Unknown error occurred"));
        }
    }

    public async addMember(): Promise<Result<UserInnerCircle, Error>> {
        const name = this.newMemberName$.get().trim();
        const relationType = this.newMemberRelationType$.get().trim();

        if (!name || !relationType) {
            return err(new Error("Name and relationship type are required"));
        }

        this.isLoading$.set(true);
        this.error$.set("");

        try {
            const result = await this._innerCircleService.createInnerCircleMember(name, relationType);
            this.isLoading$.set(false);

            if (result.isOk()) {
                this.newMemberName$.set("");
                this.newMemberRelationType$.set("");
            } else {
                this.error$.set(result.error.message);
            }

            return result;
        } catch (error) {
            this.isLoading$.set(false);
            this.error$.set(error instanceof Error ? error.message : "Unknown error occurred");
            return err(error instanceof Error ? error : new Error("Unknown error occurred"));
        }
    }

    public async updateMember(
        id: string,
        updates: Partial<UserInnerCircle>
    ): Promise<Result<UserInnerCircle, Error>> {
        this.isLoading$.set(true);
        this.error$.set("");

        try {
            const result = await this._innerCircleService.updateInnerCircleMember(id, updates);
            this.isLoading$.set(false);

            if (result.isErr()) {
                this.error$.set(result.error.message);
            }

            return result;
        } catch (error) {
            this.isLoading$.set(false);
            this.error$.set(error instanceof Error ? error.message : "Unknown error occurred");
            return err(error instanceof Error ? error : new Error("Unknown error occurred"));
        }
    }

    public async removeMember(id: string): Promise<Result<boolean, Error>> {
        this.isLoading$.set(true);
        this.error$.set("");

        try {
            const result = await this._innerCircleService.deleteInnerCircleMember(id);
            this.isLoading$.set(false);

            if (result.isErr()) {
                this.error$.set(result.error.message);
            }

            return result;
        } catch (error) {
            this.isLoading$.set(false);
            this.error$.set(error instanceof Error ? error.message : "Unknown error occurred");
            return err(error instanceof Error ? error : new Error("Unknown error occurred"));
        }
    }
} 