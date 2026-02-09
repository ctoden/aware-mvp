import { UserLongTermGoal, userLongTermGoals$, getUserLongTermGoalsArray, upsertUserLongTermGoal, removeUserLongTermGoal, clearUserLongTermGoals } from '../UserLongTermGoal';

describe('UserLongTermGoal Model', () => {
    beforeEach(() => {
        clearUserLongTermGoals();
    });

    it('should initialize with null value', () => {
        expect(userLongTermGoals$.peek()).toBeNull();
    });

    it('should return empty array when no goals exist', () => {
        const goals = getUserLongTermGoalsArray();
        expect(goals).toEqual([]);
    });

    it('should upsert a goal', () => {
        const goal: UserLongTermGoal = {
            id: '1',
            user_id: 'user1',
            goal: 'Learn TypeScript',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        upsertUserLongTermGoal(goal);
        const goals = getUserLongTermGoalsArray();
        expect(goals).toHaveLength(1);
        expect(goals[0]).toEqual(goal);
    });

    it('should update an existing goal', () => {
        const goal: UserLongTermGoal = {
            id: '1',
            user_id: 'user1',
            goal: 'Learn TypeScript',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        upsertUserLongTermGoal(goal);

        const updatedGoal: UserLongTermGoal = {
            ...goal,
            goal: 'Master TypeScript'
        };

        upsertUserLongTermGoal(updatedGoal);
        const goals = getUserLongTermGoalsArray();
        expect(goals).toHaveLength(1);
        expect(goals[0]).toEqual(updatedGoal);
    });

    it('should remove a goal', () => {
        const goal: UserLongTermGoal = {
            id: '1',
            user_id: 'user1',
            goal: 'Learn TypeScript',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        upsertUserLongTermGoal(goal);
        removeUserLongTermGoal(goal.id);
        const goals = getUserLongTermGoalsArray();
        expect(goals).toHaveLength(0);
    });

    it('should clear all goals', () => {
        const goal1: UserLongTermGoal = {
            id: '1',
            user_id: 'user1',
            goal: 'Learn TypeScript',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const goal2: UserLongTermGoal = {
            id: '2',
            user_id: 'user1',
            goal: 'Master React',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        upsertUserLongTermGoal(goal1);
        upsertUserLongTermGoal(goal2);
        clearUserLongTermGoals();
        expect(userLongTermGoals$.peek()).toBeNull();
        expect(getUserLongTermGoalsArray()).toHaveLength(0);
    });
}); 