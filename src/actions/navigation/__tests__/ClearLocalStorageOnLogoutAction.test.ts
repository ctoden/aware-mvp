import { ClearLocalStorageOnLogoutAction } from '../ClearLocalStorageOnLogoutAction';
import { LocalStorageService } from '@src/services/LocalStorageService';
import { TestStorageProvider } from '@src/providers/storage/__tests__/TestStorageProvider';
import { DependencyService } from '@src/core/injection/DependencyService';
import { STORAGE_PROVIDER_KEY } from '@src/providers/storage/StorageProvider';
import { ok, err } from 'neverthrow';

describe('ClearLocalStorageOnLogoutAction', () => {
    let action: ClearLocalStorageOnLogoutAction;
    let localStorageService: LocalStorageService;
    let testStorageProvider: TestStorageProvider;

    beforeEach(async () => {
        // Create and initialize the test provider
        testStorageProvider = new TestStorageProvider();
        await testStorageProvider.initialize();
        
        // Register the provider
        DependencyService.registerValue(STORAGE_PROVIDER_KEY, testStorageProvider);
        
        // Create and initialize the storage service
        localStorageService = new LocalStorageService();
        await localStorageService.initialize();

        // Create the action
        action = new ClearLocalStorageOnLogoutAction();
    });

    afterEach(async () => {
        await localStorageService.end();
        await testStorageProvider.end();
    });

    it('should clear local storage successfully', async () => {
        // Arrange
        // Store some test data
        await localStorageService.setItem('testKey1', 'value1');
        await localStorageService.setItem('testKey2', 'value2');

        // Act
        const result = await action.execute();

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(true);
        }

        // Verify storage is cleared
        const getResult1 = await localStorageService.getItem('testKey1');
        const getResult2 = await localStorageService.getItem('testKey2');
        
        expect(getResult1.isOk() && getResult1.value).toBeNull();
        expect(getResult2.isOk() && getResult2.value).toBeNull();
    });

    it('should handle storage clear error gracefully', async () => {
        // Arrange
        // Mock the storage provider to simulate an error
        testStorageProvider.setError(new Error('Storage clear failed'));

        // Act
        const result = await action.execute();

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(true);
        }
        // Even though storage clear failed, the action should still return success
        // as per the implementation's error handling strategy
    });

    it('should handle unexpected errors gracefully', async () => {
        // Arrange
        // Mock the storage provider to throw an unexpected error
        testStorageProvider.setError(new Error('Unexpected error'));

        // Act
        const result = await action.execute();

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(true);
        }
        // Even with unexpected errors, the action should still return success
        // as per the implementation's error handling strategy
    });

    it('should clear all storage keys', async () => {
        // Arrange
        // Store multiple items with different types
        await localStorageService.setItem('stringKey', 'string value');
        await localStorageService.setItem('numberKey', '42');
        await localStorageService.setItem('objectKey', JSON.stringify({ test: 'object' }));

        // Act
        const result = await action.execute();

        // Assert
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toBe(true);
        }

        // Verify all storage is cleared
        const stringResult = await localStorageService.getItem('stringKey');
        const numberResult = await localStorageService.getItem('numberKey');
        const objectResult = await localStorageService.getItem('objectKey');
        
        expect(stringResult.isOk() && stringResult.value).toBeNull();
        expect(numberResult.isOk() && numberResult.value).toBeNull();
        expect(objectResult.isOk() && objectResult.value).toBeNull();
    });
}); 