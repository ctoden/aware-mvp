import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { Service } from "./Service";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { DependencyService } from "@src/core/injection/DependencyService";
import { IDataProvider, DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { IData } from "@src/types/IData";

@singleton()
export class DataService extends Service {
    private static _instance: DataService;
    private _dataProvider: IDataProvider | null = null;

    constructor() {
        super('DataService');
        if (DataService._instance) {
            return DataService._instance;
        }
        DataService._instance = this;
    }

    static getInstance(): DataService {
        if (!DataService._instance) {
            DataService._instance = new DataService();
        }
        return DataService._instance;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this._dataProvider = DependencyService.resolveSafe(DATA_PROVIDER_KEY);
        if (!this._dataProvider) {
            return err(new Error('No data provider registered'));
        }
        return ok(true);
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        if (!this._dataProvider) {
            return ok(true);
        }
        return this._dataProvider.end();
    }

    private ensureProvider(): Result<IDataProvider, Error> {
        if (!this._dataProvider || !this._dataProvider.hasBeenInitialized) {
            return err(new Error('Data provider not initialized'));
        }
        return ok(this._dataProvider);
    }

    async fetchData<T>(
        collection: string,
        query: {
            select?: string;
            filter?: { field: string; value: any }[];
        }
    ): Promise<Result<T[], Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return providerResult.value.fetchData<T>(collection, query);
    }

    async updateData<T extends IData>(collection: string, data: T): Promise<Result<T, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return providerResult.value.updateData<T>(collection, data);
    }

    async upsertData<T>(collection: string, data: T | T[]): Promise<Result<T[], Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return providerResult.value.upsertData<T>(collection, data);
    }

    async deleteData(
        collection: string,
        query: {
            filter?: { field: string; value: any }[];
        }
    ): Promise<Result<boolean, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            return err(providerResult.error);
        }
        return providerResult.value.deleteData(collection, query);
    }
} 