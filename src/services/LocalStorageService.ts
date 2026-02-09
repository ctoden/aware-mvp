import { singleton } from "tsyringe";
import { err, ok, Result } from "neverthrow";
import { Service } from "./Service";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { IStorageProvider, STORAGE_PROVIDER_KEY } from "@src/providers/storage/StorageProvider";
import { DependencyService } from "@src/core/injection/DependencyService";

@singleton()
export class LocalStorageService extends Service {
    private static _instance: LocalStorageService;
    private _storageProvider: IStorageProvider | null = null;

    constructor() {
        super('LocalStorageService');
        if (LocalStorageService._instance) {
            return LocalStorageService._instance;
        }
        LocalStorageService._instance = this;
    }

    static getInstance(): LocalStorageService {
        if (!LocalStorageService._instance) {
            LocalStorageService._instance = new LocalStorageService();
        }
        return LocalStorageService._instance;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this._storageProvider = DependencyService.resolveSafe(STORAGE_PROVIDER_KEY);
        if (!this._storageProvider) {
            console.error('LocalStorageService.onInitialize: No storage provider registered');
            return err(new Error('No storage provider registered'));
        }
        return ok(true);
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return ok(true);
    }

    private ensureProvider(): Result<IStorageProvider, Error> {
        if (!this._storageProvider) {
            console.error('LocalStorageService.ensureProvider: Storage provider not initialized');
            return err(new Error('Storage provider not initialized'));
        }
        return ok(this._storageProvider);
    }

    async setItem(key: string, value: string): Promise<Result<void, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            console.error(`LocalStorageService.setItem: Failed to ensure provider:`, providerResult.error);
            return err(providerResult.error);
        }
        const result = await providerResult.value.setItem(key, value);
        if (result.isErr()) {
            console.error(`LocalStorageService.setItem: Provider failed to set ${key}:`, result.error);
        }
        return result;
    }

    async getItem(key: string): Promise<Result<string | null, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            console.error(`LocalStorageService.getItem: Failed to ensure provider:`, providerResult.error);
            return err(providerResult.error);
        }
        const result = await providerResult.value.getItem(key);
        if (result.isErr()) {
            console.error(`LocalStorageService.getItem: Provider failed to get ${key}:`, result.error);
        }
        return result;
    }

    async removeItem(key: string): Promise<Result<void, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            console.error(`LocalStorageService.removeItem: Failed to ensure provider:`, providerResult.error);
            return err(providerResult.error);
        }
        const result = await providerResult.value.removeItem(key);
        if (result.isErr()) {
            console.error(`LocalStorageService.removeItem: Provider failed to remove ${key}:`, result.error);
        }
        return result;
    }

    async clear(): Promise<Result<void, Error>> {
        const providerResult = this.ensureProvider();
        if (providerResult.isErr()) {
            console.error(`LocalStorageService.clear: Failed to ensure provider:`, providerResult.error);
            return err(providerResult.error);
        }
        const result = await providerResult.value.clear();
        if (result.isErr()) {
            console.error(`LocalStorageService.clear: Provider failed to clear:`, result.error);
        }
        return result;
    }
} 