import { err, ok, Result } from "neverthrow";
import { singleton } from "tsyringe";
import { IDataProvider } from "../DataProvider";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import {isNil} from "lodash";
// No database types import needed

@singleton()
export class TestDataProvider extends ObservableLifecycleManager implements IDataProvider {
    private static _instance: TestDataProvider;
    private dataStore: Map<string, any[]> = new Map();
    name = 'TestDataProvider';

    constructor() {
        super();
        if (TestDataProvider._instance) {
            return TestDataProvider._instance;
        }
        TestDataProvider._instance = this;
    }

    get hasBeenInitialized(): boolean {
        return this.isInitialized.get();
    }

    // Test helper methods
    setTestData(collection: string, data: any[]) {
        if(isNil(data)) {
            this.dataStore.delete(collection);
            return;
        }
        this.dataStore.set(collection, [...data]);
    }

    clearTestData() {
        this.dataStore.clear();
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.clearTestData();
        return BR_TRUE;
    }

    async fetchData<T>(
        collection: string,
        query: {
            select?: string;
            filter?: { field: string; value: any }[];
        }
    ): Promise<Result<T[], Error>> {
        const data = this.dataStore.get(collection) || [];

        let filteredData = [...data];
        if (query.filter) {
            filteredData = data.filter(item =>
                query.filter!.every(({ field, value }) => item[field] === value)
            );
        }

        return ok(filteredData as T[]);
    }

    private hasUpdatedAtField(data: any): boolean {
        return data && typeof data === 'object' && 'updated_at' in data;
    }

    private addUpdatedAtTimestamp<T>(data: T): T {
        if (this.hasUpdatedAtField(data)) {
            return {
                ...data,
                updated_at: new Date().toISOString()
            };
        }
        return data;
    }

    async updateData<T>(collection: string, data: T): Promise<Result<T, Error>> {
        const existingData = this.dataStore.get(collection) || [];
        const index = existingData.findIndex((item: any) => item.id === (data as any).id);

        if (index === -1) {
           return err(new Error(`Record not found`));
        }

        const updatedData = this.addUpdatedAtTimestamp(data);
        existingData[index] = updatedData;

        this.dataStore.set(collection, existingData);
        return ok(updatedData as T);
    }

    async upsertData<T>(collection: string, data: T[]): Promise<Result<T[], Error>> {
        const existingData = this.dataStore.get(collection) || [];

        if(!Array.isArray(data)) {
            data = [data];
        }

        const updatedData = data.map(item => this.addUpdatedAtTimestamp(item));

        updatedData.forEach(item => {
            const index = existingData.findIndex((existing: any) => existing.id === (item as any).id);
            if (index === -1) {
                existingData.push(item);
            } else {
                existingData[index] = item;
            }
        });

        this.dataStore.set(collection, existingData);
        return ok(updatedData as T[]);
    }

    async deleteData(
        collection: string,
        query: {
            filter?: { field: string; value: any }[];
        }
    ): Promise<Result<boolean, Error>> {
        try {
            const data = this.dataStore.get(collection) || [];

            if (!query.filter || query.filter.length === 0) {
                return err(new Error('Filter is required for delete operations'));
            }

            // Keep items that don't match ALL filter criteria
            // This means we delete items that match ALL criteria
            const filteredData = data.filter(item => {
                // For each item, check if it matches all filter criteria
                const matchesAllCriteria = query.filter!.every(
                    ({ field, value }) => item[field] === value
                );
                // Keep items that don't match all criteria
                return !matchesAllCriteria;
            });

            // Store the filtered data (with matching items removed)
            this.dataStore.set(collection, filteredData);

            // Always return success, even if no items were deleted
            return ok(true);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to delete data'));
        }
    }
}