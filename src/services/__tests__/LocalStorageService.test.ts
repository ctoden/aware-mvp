import { LocalStorageService } from '../LocalStorageService';
import { TestStorageProvider } from '@src/providers/storage/__tests__/TestStorageProvider';
import { DependencyService } from "@src/core/injection/DependencyService";
import { STORAGE_PROVIDER_KEY } from '@src/providers/storage/StorageProvider';

describe('LocalStorageService', () => {
    let storageService: LocalStorageService;
    let testStorageProvider: TestStorageProvider;

    beforeEach(async () => {
        // Create and initialize the test provider
        testStorageProvider = new TestStorageProvider();
        await testStorageProvider.initialize();
        
        // Register the provider
        DependencyService.registerValue(STORAGE_PROVIDER_KEY, testStorageProvider);
        
        // Create and initialize the storage service
        storageService = new LocalStorageService();
        await storageService.initialize();
    });

    afterEach(async () => {
        await storageService.end();
        await testStorageProvider.end();
    });

    it('should store and retrieve a value', async () => {
        const key = 'testKey';
        const value = 'testValue';

        const setResult = await storageService.setItem(key, value);
        expect(setResult.isOk()).toBe(true);

        const getResult = await storageService.getItem(key);
        expect(getResult.isOk()).toBe(true);
        if (getResult.isOk()) {
            expect(getResult.value).toBe(value);
        }
    });

    it('should return null for non-existent key', async () => {
        const result = await storageService.getItem('nonexistent');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBeNull();
        }
    });

    it('should remove a value', async () => {
        const key = 'testKey';
        const value = 'testValue';

        await storageService.setItem(key, value);
        const removeResult = await storageService.removeItem(key);
        expect(removeResult.isOk()).toBe(true);

        const getResult = await storageService.getItem(key);
        expect(getResult.isOk()).toBe(true);
        if (getResult.isOk()) {
            expect(getResult.value).toBeNull();
        }
    });

    it('should clear all values', async () => {
        await storageService.setItem('key1', 'value1');
        await storageService.setItem('key2', 'value2');

        const clearResult = await storageService.clear();
        expect(clearResult.isOk()).toBe(true);

        const getResult1 = await storageService.getItem('key1');
        const getResult2 = await storageService.getItem('key2');
        
        expect(getResult1.isOk() && getResult1.value).toBeNull();
        expect(getResult2.isOk() && getResult2.value).toBeNull();
    });
}); 