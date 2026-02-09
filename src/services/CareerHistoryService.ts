import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { Service } from "./Service";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { DataService } from "./DataService";
import { CareerHistoryEntry, careerHistory$, clearCareerHistory } from "@src/models/CareerHistoryModel";
import { user$ } from "@src/models/SessionModel";
import { generateUUID } from "@src/utils/UUIDUtil";
import { AuthService } from "@src/services/AuthService";
import { ChangeEvent, ChangeType } from "@src/events/ChangeEvent";
import {EventAwareService} from "@src/services/EventAwareService";

@singleton()
export class CareerHistoryService extends EventAwareService {

    private readonly _dataService!: DataService;
    protected _authService: AuthService;

    constructor() {
        super('CareerHistoryService', [ChangeType.LOGIN]);
        this._dataService = this.addDependency(DataService);
        this._authService = this.addDependency(AuthService);
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        try {
            // Check if user is already authenticated when service initializes
            if (await this._authService.isAuthenticated()) {
                const userId = user$.peek()?.id;
                if (userId) {
                    await this.fetchCareerHistory(userId);
                }
            }
            await this.initializeCustomSubscriptions();
        return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error(String(error)));
        }
    }

    protected async onStateChange(event: ChangeEvent): Promise<void> {
        if (event.type === ChangeType.LOGIN) {
            const user = user$.peek();
            if (user?.id) {
                // Fetch career history for authenticated user
                await this.fetchCareerHistory(user.id);
            }
        }
    }

    protected async initializeCustomSubscriptions(): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        clearCareerHistory();
        return ok(true);
    }

    async fetchCareerHistory(userId: string): Promise<Result<CareerHistoryEntry[], Error>> {
        const result = await this._dataService.fetchData<CareerHistoryEntry>('career_history', {
            filter: [{ field: 'user_id', value: userId }]
        });
        if (result.isErr()) {
            return err(result.error);
        }
        careerHistory$.set(result.value);
        return ok(result.value);
    }

    async createCareerHistoryEntry(positionText: string): Promise<Result<CareerHistoryEntry, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const newEntry: CareerHistoryEntry = {
            id: generateUUID(),
            user_id: userId,
            position_text: positionText,
            created_at: new Date(),
            updated_at: new Date()
        };
        const result = await this._dataService.upsertData<CareerHistoryEntry>('career_history', [newEntry]);
        if (result.isErr()) {
            return err(result.error);
        }
        careerHistory$.set((prev) => [...prev, newEntry]);
        return ok(newEntry);
    }

    async updateCareerHistoryEntry(id: string, positionText: string): Promise<Result<CareerHistoryEntry, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const currentEntries = careerHistory$.peek();
        const existingEntry = currentEntries.find(entry => entry.id === id);
        if (!existingEntry) {
            return err(new Error('Entry not found'));
        }
        const updatedEntry: CareerHistoryEntry = {
            ...existingEntry,
            position_text: positionText,
            updated_at: new Date()
        };
        const result = await this._dataService.updateData<CareerHistoryEntry>('career_history', updatedEntry);
        if (result.isErr()) {
            return err(result.error);
        }
        careerHistory$.set((prev) => prev.map(entry => entry.id === id ? updatedEntry : entry));
        return ok(updatedEntry);
    }

    async deleteCareerHistoryEntry(id: string): Promise<Result<boolean, Error>> {
        const userId = user$.peek()?.id;
        if (!userId) {
            return err(new Error('No user logged in'));
        }
        const result = await this._dataService.deleteData('career_history', {
            filter: [
                { field: 'id', value: id },
                { field: 'user_id', value: userId }
            ]
        });
        if (result.isErr()) {
            return err(result.error);
        }
        careerHistory$.set((prev) => prev.filter(entry => entry.id !== id));
        return ok(true);
    }
} 