import {container} from 'tsyringe';
import {UserLongTermGoalViewModel} from '../UserLongTermGoalViewModel';
import {UserLongTermGoalService} from '@src/services/UserLongTermGoalService';
import {DataService} from '@src/services/DataService';
import {TestDataProvider} from '@src/providers/data/__tests__/TestDataProvider';
import {DependencyService} from '@src/core/injection/DependencyService';
import {DATA_PROVIDER_KEY} from '@src/providers/data/DataProvider';
import {user$} from '@src/models/SessionModel';
import {clearUserLongTermGoals} from '@src/models/UserLongTermGoal';

describe('UserLongTermGoalViewModel', () => {
    let viewModel: UserLongTermGoalViewModel;
    let testDataProvider: TestDataProvider;
    let dataService: DataService;
    let userLongTermGoalService: UserLongTermGoalService;
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
        
        // Create and initialize the view model
        viewModel = DependencyService.resolve(UserLongTermGoalViewModel);
        await viewModel.initialize();

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
        await viewModel.end();
        await userLongTermGoalService.end();
        await dataService.end();
        await testDataProvider.end();
        user$.set(null);
        clearUserLongTermGoals();
    });

    it('should initialize with empty goals', () => {
        const goals = viewModel.getUserLongTermGoals();
        expect(goals).toHaveLength(0);
    });

    it('should add a new goal', async () => {
        const result = await viewModel.addUserLongTermGoal('Learn TypeScript');
        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
            const goals = viewModel.getUserLongTermGoals();
            expect(goals).toHaveLength(1);
            expect(goals[0].goal).toBe('Learn TypeScript');
        }
    });

    it('should update an existing goal', async () => {
        const createResult = await viewModel.addUserLongTermGoal('Learn TypeScript');
        expect(createResult.isOk()).toBe(true);
        if (createResult.isOk()) {
            const updateResult = await viewModel.updateUserLongTermGoal(
                createResult.value.id,
                'Master TypeScript'
            );
            expect(updateResult.isOk()).toBe(true);
            if (updateResult.isOk()) {
                const goals = viewModel.getUserLongTermGoals();
                expect(goals).toHaveLength(1);
                expect(goals[0].goal).toBe('Master TypeScript');
            }
        }
    });

    it('should delete a goal', async () => {
        const createResult = await viewModel.addUserLongTermGoal('Learn TypeScript');
        expect(createResult.isOk()).toBe(true);
        if (createResult.isOk()) {
            const deleteResult = await viewModel.deleteUserLongTermGoal(createResult.value.id);
            expect(deleteResult.isOk()).toBe(true);
            const goals = viewModel.getUserLongTermGoals();
            expect(goals).toHaveLength(0);
        }
    });

    it('should fail to add goal when user is not logged in', async () => {
        user$.set(null);
        const result = await viewModel.addUserLongTermGoal('Learn TypeScript');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('No user logged in');
        }
    });

    it('should fail to update non-existent goal', async () => {
        const result = await viewModel.updateUserLongTermGoal('non-existent-id', 'Updated Goal');
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
            expect(result.error.message).toBe('Goal not found');
        }
    });
}); 