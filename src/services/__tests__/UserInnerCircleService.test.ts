import { UserInnerCircleService } from '../UserInnerCircleService';
import { TestDataProvider } from '@src/providers/data/__tests__/TestDataProvider';
import { DependencyService } from '@src/core/injection/DependencyService';
import { DATA_PROVIDER_KEY } from '@src/providers/data/DataProvider';
import { DataService } from '../DataService';
import { container } from 'tsyringe';
import { user$ } from '@src/models/SessionModel';
import { clearInnerCircle, userInnerCircle$ } from '@src/models/UserInnerCircle';

describe('UserInnerCircleService', () => {
    let userInnerCircleService: UserInnerCircleService;
    let testDataProvider: TestDataProvider;
    let dataService: DataService;
    const testUserId = 'test-user-id';

    beforeEach(async () => {
        container.clearInstances();
        
        // Create and initialize the test provider
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();
        
        // Register the test provider
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        
        // Create and initialize the data service
        dataService = new DataService();
        await dataService.initialize();
        
        // Create and initialize the service
        userInnerCircleService = DependencyService.resolve(UserInnerCircleService);
        await userInnerCircleService.initialize();

        // Set up test user
        user$.set({
            id: testUserId,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
        });
        
        clearInnerCircle();
        testDataProvider.clearTestData();
    });

    afterEach(async () => {
        await userInnerCircleService.end();
        await dataService.end();
        await testDataProvider.end();
        user$.set(null);
        clearInnerCircle();
    });

    it('should fetch user inner circle members', async () => {
        const mockMembers = [
            {
                id: '1',
                user_id: testUserId,
                name: 'John Doe',
                relationship_type: 'friend',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        testDataProvider.setTestData('user_inner_circle', mockMembers);
        const result = await userInnerCircleService.fetchUserInnerCircle(testUserId);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(1);
            expect(result.value[0].name).toBe('John Doe');
            expect(result.value[0].relationship_type).toBe('friend');
        }
    });

    it('should create a new inner circle member', async () => {
        const result = await userInnerCircleService.createInnerCircleMember('Jane Doe', 'family');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.name).toBe('Jane Doe');
            expect(result.value.relationship_type).toBe('family');
            expect(result.value.user_id).toBe(testUserId);
            const members = userInnerCircle$.peek();
            expect(members).toHaveLength(1);
            expect(members[0].name).toBe('Jane Doe');
        }
    });

    it('should update an existing member', async () => {
        const createResult = await userInnerCircleService.createInnerCircleMember('John Doe', 'friend');
        expect(createResult.isOk()).toBe(true);
        if (createResult.isOk()) {
            const updateResult = await userInnerCircleService.updateInnerCircleMember(
                createResult.value.id,
                { name: 'John Smith', relationship_type: 'family' }
            );
            expect(updateResult.isOk()).toBe(true);
            if (updateResult.isOk()) {
                expect(updateResult.value.name).toBe('John Smith');
                expect(updateResult.value.relationship_type).toBe('family');
                const members = userInnerCircle$.peek();
                expect(members).toHaveLength(1);
                expect(members[0].name).toBe('John Smith');
            }
        }
    });

    it('should delete a member', async () => {
        const createResult = await userInnerCircleService.createInnerCircleMember('John Doe', 'friend');
        expect(createResult.isOk()).toBe(true);
        if (createResult.isOk()) {
            const deleteResult = await userInnerCircleService.deleteInnerCircleMember(createResult.value.id);
            expect(deleteResult.isOk()).toBe(true);
            const members = userInnerCircle$.peek();
            expect(members).toHaveLength(0);
        }
    });

    it('should fail to create member when user is not logged in', async () => {
        user$.set(null);
        const result = await userInnerCircleService.createInnerCircleMember('John Doe', 'friend');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('No user logged in');
        }
    });

    it('should fail to update non-existent member', async () => {
        const result = await userInnerCircleService.updateInnerCircleMember('non-existent-id', { name: 'John Smith' });
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('Member not found');
        }
    });
}); 