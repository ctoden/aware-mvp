import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { Service } from "./Service";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { DataService } from "./DataService";
import { UserInnerCircle, userInnerCircle$, clearInnerCircle } from "@src/models/UserInnerCircle";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "@src/utils/UUIDUtil";

@singleton()
export class UserInnerCircleService extends Service {
    private readonly _dataService!: DataService;

    constructor() {
        super('UserInnerCircleService');
        this._dataService = this.addDependency(DataService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return ok(true);
        }
        const fetchResult = await this.fetchUserInnerCircle(userId);
        if (fetchResult.isErr()) {
            return err(fetchResult.error);
        }
        return ok(fetchResult.isOk());
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        clearInnerCircle();
        return ok(true);
    }

    async fetchUserInnerCircle(userId: string): Promise<Result<UserInnerCircle[], Error>> {
        const result = await this._dataService.fetchData<UserInnerCircle>('user_inner_circle', {
            filter: [{ field: 'user_id', value: userId }]
        });
        if (result.isErr()) {
            return err(result.error);
        }
        const valuesMap = result.value.reduce((acc, value) => {
            acc[value.id] = value;
            return acc;
        }, {} as Record<string, UserInnerCircle>);
        userInnerCircle$.set(Object.values(valuesMap));
        return ok(result.value);
    }

    async createInnerCircleMember(name: string, relationshipType: string): Promise<Result<UserInnerCircle, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const newMember: UserInnerCircle = {
            id: generateUUID(),
            user_id: userId,
            name,
            relationship_type: relationshipType,
            created_at: new Date(),
            updated_at: new Date()
        };
        const result = await this._dataService.upsertData<UserInnerCircle>('user_inner_circle', [newMember]);
        if (result.isErr()) {
            console.error('Error creating inner circle member', result.error);
            return err(result.error);
        }
        userInnerCircle$.set((prev) => [...prev, newMember]);
        return ok(newMember);
    }

    async updateInnerCircleMember(id: string, updates: Partial<UserInnerCircle>): Promise<Result<UserInnerCircle, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const currentMembers = userInnerCircle$.peek();
        const existingMember = currentMembers.find(member => member.id === id);
        if (!existingMember) {
            return err(new Error('Member not found'));
        }
        const updatedMember: UserInnerCircle = {
            ...existingMember,
            ...updates,
            updated_at: new Date()
        };
        const result = await this._dataService.updateData<UserInnerCircle>('user_inner_circle', updatedMember);
        if (result.isErr()) {
            return err(result.error);
        }
        userInnerCircle$.set((prev) => prev.map(member => member.id === id ? updatedMember : member));
        return ok(updatedMember);
    }

    async deleteInnerCircleMember(id: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const result = await this._dataService.deleteData('user_inner_circle', {
            filter: [
                { field: 'id', value: id },
                { field: 'user_id', value: userId }
            ]
        });
        if (result.isErr()) {
            return err(result.error);
        }
        userInnerCircle$.set((prev) => prev.filter(member => member.id !== id));
        return ok(true);
    }
} 