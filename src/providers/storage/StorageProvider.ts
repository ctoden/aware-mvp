import { Result } from "neverthrow";

export const STORAGE_PROVIDER_KEY = "STORAGE_PROVIDER_KEY";

export interface IStorageProvider {
    /**
     * Store a value in storage
     * @param key The key to store the value under
     * @param value The value to store
     */
    setItem(key: string, value: string): Promise<Result<void, Error>>;

    /**
     * Retrieve a value from storage
     * @param key The key to retrieve
     */
    getItem(key: string): Promise<Result<string | null, Error>>;

    /**
     * Remove a value from storage
     * @param key The key to remove
     */
    removeItem(key: string): Promise<Result<void, Error>>;

    /**
     * Clear all values from storage
     */
    clear(): Promise<Result<void, Error>>;
} 