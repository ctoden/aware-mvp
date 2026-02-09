import { Result } from "neverthrow";
import { IData } from "@src/types/IData";

export const DATA_PROVIDER_KEY = 'IDataProvider';

export interface IDataProvider {
    // use hasBeen vs is as the ObservableLifecycleManager has this same property with a different type
    readonly hasBeenInitialized: boolean;
    fetchData<T>(
        collection: string,
        query: {
            select?: string;
            filter?: { field: string; value: any }[];
        }
    ): Promise<Result<T[], Error>>;

    updateData<T extends IData>(
        collection: string,
        data: T
    ): Promise<Result<T, Error>>;

    upsertData<T>(
        collection: string,
        data: T | T[]
    ): Promise<Result<T[], Error>>;

    initialize(): Promise<Result<boolean, Error>>;
    end(): Promise<Result<boolean, Error>>;

    deleteData(
        collection: string,
        query: {
            filter?: { field: string; value: any }[];
        }
    ): Promise<Result<boolean, Error>>;
} 