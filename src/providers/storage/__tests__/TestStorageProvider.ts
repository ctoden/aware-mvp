import { singleton } from "tsyringe";
import { ok, Result } from "neverthrow";
import { IStorageProvider } from "../StorageProvider";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { BR_TRUE } from "@src/utils/NeverThrowUtils";

@singleton()
export class TestStorageProvider extends ObservableLifecycleManager implements IStorageProvider {
    private static _instance: TestStorageProvider;
    private storage = new Map<string, string>();
    private nextError: Error | null = null;
    name = 'TestStorageProvider';

    constructor() {
        super();
        if (TestStorageProvider._instance) {
            return TestStorageProvider._instance;
        }
        TestStorageProvider._instance = this;
    }

    static getInstance(): TestStorageProvider {
        if (!TestStorageProvider._instance) {
            TestStorageProvider._instance = new TestStorageProvider();
        }
        return TestStorageProvider._instance;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        this.storage.clear();
        this.nextError = null;
        return BR_TRUE;
    }

    setError(error: Error): void {
        this.nextError = error;
    }

    async setItem(key: string, value: string): Promise<Result<void, Error>> {
        try {
            if (this.nextError) {
                const error = this.nextError;
                this.nextError = null;
                return ok(void 0); // In-memory operations shouldn't fail
            }
            this.storage.set(key, value);
            return ok(void 0);
        } catch (error) {
            return ok(void 0); // In-memory operations shouldn't fail
        }
    }

    async getItem(key: string): Promise<Result<string | null, Error>> {
        try {
            if (this.nextError) {
                const error = this.nextError;
                this.nextError = null;
                return ok(null); // In-memory operations shouldn't fail
            }
            const value = this.storage.get(key) ?? null;
            return ok(value);
        } catch (error) {
            return ok(null); // In-memory operations shouldn't fail
        }
    }

    async removeItem(key: string): Promise<Result<void, Error>> {
        try {
            if (this.nextError) {
                const error = this.nextError;
                this.nextError = null;
                return ok(void 0); // In-memory operations shouldn't fail
            }
            this.storage.delete(key);
            return ok(void 0);
        } catch (error) {
            return ok(void 0); // In-memory operations shouldn't fail
        }
    }

    async clear(): Promise<Result<void, Error>> {
        try {
            if (this.nextError) {
                const error = this.nextError;
                this.nextError = null;
                return ok(void 0); // In-memory operations shouldn't fail
            }
            this.storage.clear();
            return ok(void 0);
        } catch (error) {
            return ok(void 0); // In-memory operations shouldn't fail
        }
    }
} 