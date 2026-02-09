import { DataService } from '../DataService';
import { TestDataProvider } from '@src/providers/data/__tests__/TestDataProvider';
import { DependencyService } from '@src/core/injection/DependencyService';
import { DATA_PROVIDER_KEY } from '@src/providers/data/DataProvider';

describe('DataService', () => {
    let dataService: DataService;
    let testDataProvider: TestDataProvider;

    beforeEach(async () => {
        // Create and initialize the test provider
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        
        // Register the test provider
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        
        // Create and initialize the data service
        dataService = new DataService();
        await dataService.initialize();
    });

    afterEach(async () => {
        await dataService.end();
        await testDataProvider.end();
        testDataProvider.clearTestData();
    });

    describe('fetchData', () => {
        it('should fetch data successfully', async () => {
            // Arrange
            const mockData = [
                { id: '1', name: 'Test 1' },
                { id: '2', name: 'Test 2' }
            ];
            testDataProvider.setTestData('test_collection', mockData);

            // Act
            const result = await dataService.fetchData('test_collection', {});

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(mockData);
            }
        });

        it('should filter data correctly', async () => {
            // Arrange
            const mockData = [
                { id: '1', type: 'A', name: 'Test 1' },
                { id: '2', type: 'B', name: 'Test 2' },
                { id: '3', type: 'A', name: 'Test 3' }
            ];
            testDataProvider.setTestData('test_collection', mockData);

            // Act
            const result = await dataService.fetchData('test_collection', {
                filter: [{ field: 'type', value: 'A' }]
            });

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(2);
                expect(result.value).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({ type: 'A' })
                    ])
                );
            }
        });
    });

    describe('updateData', () => {
        it('should update existing data', async () => {
            // Arrange
            const initialData = [{ id: '1', name: 'Test 1' }];
            testDataProvider.setTestData('test_collection', initialData);
            const updateData = { id: '1', name: 'Updated Test 1' };

            // Act
            const result = await dataService.updateData('test_collection', updateData);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(updateData);
            }
        });

        it('should handle update of non-existent data', async () => {
            // Arrange
            const updateData = { id: 'non-existent', name: 'Test' };

            // Act
            const result = await dataService.updateData('test_collection', updateData);

            // Assert
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Record not found');
            }
        });
    });

    describe('upsertData', () => {
        it('should insert new data', async () => {
            // Arrange
            const newData = [
                { id: '1', name: 'Test 1' },
                { id: '2', name: 'Test 2' }
            ];

            // Act
            const result = await dataService.upsertData('test_collection', newData);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(newData);
            }
        });

        it('should update existing data', async () => {
            // Arrange
            const initialData = [{ id: '1', name: 'Test 1' }];
            testDataProvider.setTestData('test_collection', initialData);
            const updateData = [{ id: '1', name: 'Updated Test 1' }];

            // Act
            const result = await dataService.upsertData('test_collection', updateData);

            // Assert
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toEqual(updateData);
            }
        });
    });

    describe('error handling', () => {
        it('should handle uninitialized provider', async () => {
            // Arrange
            await dataService.end();
            
            // Act
            const result = await dataService.fetchData('test_collection', {});

            // Assert
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Data provider not initialized');
            }
        });
    });
}); 