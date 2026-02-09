import {CoreValuesService} from '../CoreValuesService';
import {TestDataProvider} from '@src/providers/data/__tests__/TestDataProvider';
import {DependencyService} from "@src/core/injection/DependencyService";
import {DATA_PROVIDER_KEY} from '@src/providers/data/DataProvider';
import {CoreValueType, getUserCoreValuesArray, UserCoreValue, userCoreValues$} from '@src/models/UserCoreValue';
import {user$} from '@src/models/SessionModel';
import {userAssessments$} from '@src/models/UserAssessment';
import {TestLlmProvider} from '@src/providers/llm/__tests__/TestLlmProvider';
import {LLM_PROVIDER_KEY} from '@src/providers/llm/LlmProvider';

describe('CoreValuesService', () => {
    let coreValuesService: CoreValuesService;
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;
    const testUserId = 'test-user-id';
    const mockUser = {
        id: testUserId,
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    beforeEach(async () => {
        // Reset state
        userCoreValues$.set(null);
        user$.set(mockUser);

        // Setup test data provider
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);

        // Setup test llm provider
        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);

        // Setup core values service
        coreValuesService = new CoreValuesService();
        await coreValuesService.initialize();
    });

    afterEach(async () => {
        await coreValuesService.end();
        await testDataProvider.end();
        await testLlmProvider.end();
        testDataProvider.clearTestData();
        user$.set(null);
        userCoreValues$.set(null);
    });

    describe('Fetch Core Values', () => {
        it('should fetch user core values successfully', async () => {
            const mockCoreValues: UserCoreValue[] = [
                {
                    id: '1',
                    user_id: testUserId,
                    title: 'Test Value 1',
                    description: 'Description 1',
                    value_type: CoreValueType.SYSTEM_GENERATED,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];

            testDataProvider.setTestData('user_core_values', mockCoreValues);

            const result = await coreValuesService.fetchUserCoreValues(testUserId);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(1);
                expect(result.value[0].title).toBe('Test Value 1');
            }

            // Check observable state
            const observableValues = userCoreValues$.peek();
            expect(observableValues).toBeDefined();
            expect(observableValues?.['1'].title).toBe('Test Value 1');
        });

        it('should handle empty results', async () => {
            testDataProvider.setTestData('user_core_values', []);

            const result = await coreValuesService.fetchUserCoreValues(testUserId);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(0);
            }

            const observableValues = userCoreValues$.peek();
            expect(observableValues).toEqual({});
        });
    });

    describe('Create Core Value', () => {
        it('should create a new core value successfully', async () => {
            const newValue = {
                title: 'New Value',
                description: 'New Description'
            };

            const result = await coreValuesService.createCoreValue(newValue);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.title).toBe('New Value');
                expect(result.value.user_id).toBe(testUserId);
                expect(result.value.value_type).toBe(CoreValueType.SYSTEM_GENERATED);
            }

            // Verify it was added to the observable state
            const observableValues = userCoreValues$.peek();
            const createdValue = Object.values(observableValues ?? {})[0];
            expect(createdValue?.title).toBe('New Value');
        });

        it('should fail to create when no user is logged in', async () => {
            user$.set(null);

            const newValue = {
                title: 'New Value',
                description: 'New Description'
            };

            const result = await coreValuesService.createCoreValue(newValue);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No user logged in');
            }
        });
    });

    describe('Update Core Value', () => {
        it('should update an existing core value', async () => {
            const existingValue: UserCoreValue = {
                id: '1',
                user_id: testUserId,
                title: 'Original Title',
                description: 'Original Description',
                value_type: CoreValueType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            testDataProvider.setTestData('user_core_values', [existingValue]);
            await coreValuesService.fetchUserCoreValues(testUserId);

            const updates = {
                title: 'Updated Title',
                description: 'Updated Description'
            };

            const result = await coreValuesService.updateCoreValue('1', updates);
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.title).toBe('Updated Title');
                expect(result.value.description).toBe('Updated Description');
            }

            // Verify observable state was updated
            const observableValues = userCoreValues$.peek();
            expect(observableValues?.['1'].title).toBe('Updated Title');
        });

        it('should fail to update non-existent core value', async () => {
            const updates = {
                title: 'Updated Title',
                description: 'Updated Description'
            };

            const result = await coreValuesService.updateCoreValue('non-existent-id', updates);
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Core value not found');
            }
        });
    });

    describe('Delete Core Value', () => {
        it('should delete an existing core value', async () => {
            const existingValue: UserCoreValue = {
                id: '1',
                user_id: testUserId,
                title: 'To Be Deleted',
                description: 'Will be deleted',
                value_type: CoreValueType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            testDataProvider.setTestData('user_core_values', [existingValue]);
            await coreValuesService.fetchUserCoreValues(testUserId);

            const result = await coreValuesService.deleteCoreValue('1');
            expect(result.isOk()).toBe(true);

            // Verify it was removed from observable state
            const observableValues = userCoreValues$.peek();
            expect(observableValues?.['1']).toBeUndefined();
        });

        it('should handle deleting non-existent core value', async () => {
            const result = await coreValuesService.deleteCoreValue('non-existent-id');
            expect(result.isOk()).toBe(true); // Delete should succeed even if value doesn't exist
        });

        it('should fail to delete when no user is logged in', async () => {
            user$.set(null);

            const result = await coreValuesService.deleteCoreValue('1');
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No user logged in');
            }
        });
    });

    describe('Core Values from Assessments', () => {
        it('should create core values when assessments change', async () => {
            // use datejs to make the update time for these in the future
            // Setup initial state
            const testAssessment = {
                id: '1',
                user_id: testUserId,
                assessment_type: 'MBTI',
                name: 'Myers Briggs (MBTI) Assessment',
                assessment_full_text: '',
                assessment_summary: 'ENTJ',
                created_at: new Date().toISOString(),
                updated_at: new Date(Date.now() + 60000).toISOString()
            };

            // Set test data and initialize service
            testDataProvider.setTestData('user_core_values', []);
            await coreValuesService.initialize();

            const validResponse = JSON.stringify([
                { title: "Value One", description: "First core value description." },
                { title: "Value Two", description: "Second core value description." },
                { title: "Value Three", description: "Third core value description." }
            ]);
            testLlmProvider.setNextResponse(validResponse);

            // Trigger assessment change
            userAssessments$.set([testAssessment]);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verify core values were created
            const values = getUserCoreValuesArray();
            expect(values).not.toBeNull();
            expect(values.length).toBeGreaterThan(0);

            // Verify core values have correct properties
            values.forEach(value => {
                expect(value).toHaveProperty('id');
                expect(value).toHaveProperty('user_id', testUserId);
                expect(value).toHaveProperty('title');
                expect(value).toHaveProperty('description');
                expect(value).toHaveProperty('value_type', CoreValueType.SYSTEM_GENERATED);
                expect(value).toHaveProperty('created_at');
                expect(value).toHaveProperty('updated_at');
            });
        }, 5000);

        it('should not create core values when no user is logged in', async () => {
            // Clear user
            user$.set(null);

            const testAssessment = {
                id: '1',
                user_id: 'some-id',
                assessment_type: 'personality',
                name: 'Personality Assessment',
                assessment_full_text: 'Full assessment text',
                assessment_summary: 'Test assessment summary',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Set test data and initialize service
            testDataProvider.setTestData('user_core_values', []);
            await coreValuesService.initialize();

            // Trigger assessment change
            userAssessments$.set([testAssessment]);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 100));

            // Verify no core values were created
            const values = userCoreValues$.peek();
            expect(values).toBeNull();
        });

        it('should clear existing core values before creating new ones', async () => {
            // Setup existing core value
            const existingValue: UserCoreValue = {
                id: '1',
                user_id: testUserId,
                title: 'Existing Value',
                description: 'Should be cleared',
                value_type: CoreValueType.SYSTEM_GENERATED,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const testAssessment = {
                id: '1',
                user_id: testUserId,
                assessment_type: 'personality',
                name: 'Personality Assessment',
                assessment_full_text: 'Full assessment text',
                assessment_summary: 'New assessment summary',
                created_at: new Date().toISOString(),
                updated_at: new Date(Date.now() + 60000).toISOString()
            };

            // Set test data with existing value
            testDataProvider.setTestData('user_core_values', [existingValue]);
            await coreValuesService.fetchUserCoreValues(user$.id.peek() ?? "")

            // Verify existing value
            let values = getUserCoreValuesArray();
            expect(values.length).toBe(1);


            const validResponse = JSON.stringify([
                { title: "Value One", description: "First core value description." },
                { title: "Value Two", description: "Second core value description." },
                { title: "Value Three", description: "Third core value description." }
            ]);
            testLlmProvider.setNextResponse(validResponse);


            // Trigger assessment change
            userAssessments$.set([testAssessment]);

            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 500));

            // Verify old value was cleared and new values exist
            values = getUserCoreValuesArray();
            expect(values.length).toBe(3)
            expect(values.find(v => v.id === existingValue.id)).toBeUndefined();
            expect(values.find(v => v.title === existingValue.title)).toBeUndefined();

        });
    });
}); 