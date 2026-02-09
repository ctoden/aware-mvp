import {UserLongTermGoalService} from '../UserLongTermGoalService';
import {TestDataProvider} from '@src/providers/data/__tests__/TestDataProvider';
import {DependencyService} from '@src/core/injection/DependencyService';
import {DATA_PROVIDER_KEY} from '@src/providers/data/DataProvider';
import {DataService} from '../DataService';
import {container} from 'tsyringe';
import {user$} from '@src/models/SessionModel';
import {clearUserLongTermGoals, getUserLongTermGoalsArray} from '@src/models/UserLongTermGoal';

describe('UserLongTermGoalService', () => {
    let userLongTermGoalService: UserLongTermGoalService;
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
        userLongTermGoalService = DependencyService.resolve(UserLongTermGoalService);
        await userLongTermGoalService.initialize();

        // Set up test user
        user$.set({
            id: testUserId,
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
        });
        
        clearUserLongTermGoals();
        testDataProvider.clearTestData();
    });

    afterEach(async () => {
        await userLongTermGoalService.end();
        await dataService.end();
        await testDataProvider.end();
        user$.set(null);
        clearUserLongTermGoals();
    });

    it('should fetch user long term goals', async () => {
        const mockGoals = [
            {
                id: '1',
                user_id: testUserId,
                goal: 'Learn TypeScript',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        testDataProvider.setTestData('user_long_term_goals', mockGoals);
        const result = await userLongTermGoalService.fetchUserLongTermGoals(testUserId);
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value).toHaveLength(1);
            expect(result.value[0].goal).toBe('Learn TypeScript');
        }
    });

    it('should create a new long term goal', async () => {
        const result = await userLongTermGoalService.createUserLongTermGoal('Master React Native');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            expect(result.value.goal).toBe('Master React Native');
            expect(result.value.user_id).toBe(testUserId);
            const goals = getUserLongTermGoalsArray();
            expect(goals).toHaveLength(1);
            expect(goals[0].goal).toBe('Master React Native');
        }
    });

    it('should update an existing goal', async () => {
        const createResult = await userLongTermGoalService.createUserLongTermGoal('Learn TypeScript');
        expect(createResult.isOk()).toBe(true);
        if (createResult.isOk()) {
            const updateResult = await userLongTermGoalService.updateUserLongTermGoal(
                createResult.value.id,
                'Master TypeScript'
            );
            expect(updateResult.isOk()).toBe(true);
            if (updateResult.isOk()) {
                expect(updateResult.value.goal).toBe('Master TypeScript');
                const goals = getUserLongTermGoalsArray();
                expect(goals).toHaveLength(1);
                expect(goals[0].goal).toBe('Master TypeScript');
            }
        }
    });

    it('should delete a goal', async () => {
        const createResult = await userLongTermGoalService.createUserLongTermGoal('Learn TypeScript');
        expect(createResult.isOk()).toBe(true);
        if (createResult.isOk()) {
            const deleteResult = await userLongTermGoalService.deleteUserLongTermGoal(createResult.value.id);
            expect(deleteResult.isOk()).toBe(true);
            const goals = getUserLongTermGoalsArray();
            expect(goals).toHaveLength(0);
        }
    });

    it('should fail to create goal when user is not logged in', async () => {
        user$.set(null);
        const result = await userLongTermGoalService.createUserLongTermGoal('Learn TypeScript');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('No user logged in');
        }
    });

    it('should fail to update non-existent goal', async () => {
        const result = await userLongTermGoalService.updateUserLongTermGoal('non-existent-id', 'Updated Goal');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('Goal not found');
        }
    });
}); 