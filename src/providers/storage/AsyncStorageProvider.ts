import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { IStorageProvider } from "./StorageProvider";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";

@singleton()
export class AsyncStorageProvider extends ObservableLifecycleManager implements IStorageProvider {
    private static _instance: AsyncStorageProvider;
    name = 'AsyncStorageProvider';

    constructor() {
        super();
        if (AsyncStorageProvider._instance) {
            return AsyncStorageProvider._instance;
        }
        AsyncStorageProvider._instance = this;
    }

    static getInstance(): AsyncStorageProvider {
        if (!AsyncStorageProvider._instance) {
            AsyncStorageProvider._instance = new AsyncStorageProvider();
        }
        return AsyncStorageProvider._instance;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    async setItem(key: string, value: string): Promise<Result<void, Error>> {
        try {
            await AsyncStorage.setItem(key, value);
            return ok(void 0);
        } catch (error) {
            console.error(`AsyncStorageProvider: Error setting ${key}:`, error);
            return err(error instanceof Error ? error : new Error('Failed to set item in storage'));
        }
    }

    async getItem(key: string): Promise<Result<string | null, Error>> {
        try {
            const value = await AsyncStorage.getItem(key);
            return ok(value);
        } catch (error) {
            console.error(`AsyncStorageProvider: Error getting ${key}:`, error);
            return err(error instanceof Error ? error : new Error('Failed to get item from storage'));
        }
    }

    async removeItem(key: string): Promise<Result<void, Error>> {
        try {
            await AsyncStorage.removeItem(key);
            return ok(void 0);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to remove item from storage'));
        }
    }

    async clear(): Promise<Result<void, Error>> {
        try {
            await AsyncStorage.clear();
            return ok(void 0);
        } catch (error) {
            return err(error instanceof Error ? error : new Error('Failed to clear storage'));
        }
    }
} 