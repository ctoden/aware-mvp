import { TopQualitiesService } from '../TopQualitiesService';
import { TestDataProvider } from '@src/providers/data/__tests__/TestDataProvider';
import { DependencyService } from "@src/core/injection/DependencyService";
import { DATA_PROVIDER_KEY } from "@src/providers/data/DataProvider";
import { user$ } from "@src/models/SessionModel";
import { userTopQualities$, UserTopQuality } from '@src/models/UserTopQuality';
import { UserModel } from '@src/models/UserModel';
import {TestLlmProvider} from "@src/providers/llm/__tests__/TestLlmProvider";
import {LLM_PROVIDER_KEY} from "@src/providers/llm/LlmProvider";

describe('TopQualitiesService', () => {
    let topQualitiesService: TopQualitiesService;
    let testDataProvider: TestDataProvider;
    let testLlmProvider: TestLlmProvider;

    const mockUser: UserModel = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
    };

    const mockQuality1: UserTopQuality = {
        id: 'test-id-1',
        user_id: mockUser.id,
        title: 'Rationality',
        level: 'Very high',
        description: 'Test description 1',
        color: '#7B40C6',
        score: 95,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    const mockQuality2: UserTopQuality = {
        id: 'test-id-2',
        user_id: mockUser.id,
        title: 'Openness',
        level: 'High',
        description: 'Test description 2',
        color: '#255FA9',
        score: 85,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z'
    };

    beforeEach(async () => {
        // Create and initialize the test provider
        testDataProvider = new TestDataProvider();
        await testDataProvider.initialize();

        testLlmProvider = new TestLlmProvider();
        await testLlmProvider.initialize();
        
        // Register the provider
        DependencyService.registerValue(DATA_PROVIDER_KEY, testDataProvider);
        DependencyService.registerValue(LLM_PROVIDER_KEY, testLlmProvider);
        // Create and initialize the service
        topQualitiesService = new TopQualitiesService();
        
        // Set up initial test data
        testDataProvider.setTestData('user_top_qualities', [mockQuality1, mockQuality2]);
        
        // Set mock user
        user$.set(mockUser);
        
        // Initialize service after setup
        await topQualitiesService.initialize();
    });

    afterEach(async () => {
        await topQualitiesService.end();
        await testDataProvider.end();
        userTopQualities$.set(null);
        user$.set(null);
    });

    describe('initialization', () => {
        it('should initialize with user qualities when user is logged in', async () => {
            // Set mock user
            user$.set(null);
            await new Promise(resolve => setTimeout(resolve, 100));

            user$.set(mockUser);
            await new Promise(resolve => setTimeout(resolve, 100));

            const qualities = userTopQualities$.peek();
            expect(qualities).toBeTruthy();
            expect(Object.keys(qualities || {})).toHaveLength(2);
            expect(qualities?.[mockQuality1.id]).toEqual(mockQuality1);
            expect(qualities?.[mockQuality2.id]).toEqual(mockQuality2);
        });

        it('should initialize with null when no user is logged in', async () => {
            // End current service
            await topQualitiesService.end();
            user$.set(null);
            
            // Reinitialize service
            await topQualitiesService.initialize();
            
            expect(userTopQualities$.peek()).toBeNull();
        });
    });

    describe('fetchUserTopQualities', () => {
        it('should fetch qualities for a specific user', async () => {
            const result = await topQualitiesService.fetchUserTopQualities(mockUser.id);
            
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(2);
                expect(result.value).toContainEqual(mockQuality1);
                expect(result.value).toContainEqual(mockQuality2);
            }
        });

        it('should return empty array when user has no qualities', async () => {
            testDataProvider.setTestData('user_top_qualities', []);
            
            const result = await topQualitiesService.fetchUserTopQualities(mockUser.id);
            
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toHaveLength(0);
            }
        });
    });

    describe('createTopQuality', () => {
        it('should create a new quality', async () => {
            const newQuality = {
                title: 'Creativity',
                level: 'Medium',
                description: 'Test description 3',
                color: '#FF5733',
                score: 75
            };

            const result = await topQualitiesService.createTopQuality(newQuality);
            
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.user_id).toBe(mockUser.id);
                expect(result.value.title).toBe(newQuality.title);
                expect(result.value.score).toBe(newQuality.score);
                
                // Verify it's in the observable state
                const qualities = userTopQualities$.peek();
                expect(qualities?.[result.value.id]).toEqual(result.value);
            }
        });

        it('should fail to create quality when user is not logged in', async () => {
            user$.set(null);
            
            const result = await topQualitiesService.createTopQuality({
                title: 'Test',
                level: 'High',
                description: 'Test',
                color: '#000000',
                score: 80
            });
            
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No user logged in');
            }
        });
    });

    describe('updateTopQuality', () => {
        it('should update an existing quality', async () => {
            const updates = {
                level: 'Medium',
                score: 5
            };

            const result = await topQualitiesService.updateTopQuality(mockQuality1.id, updates);
            
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value.level).toBe(updates.level);
                expect(result.value.score).toBe(updates.score);
                expect(result.value.title).toBe(mockQuality1.title); // Unchanged field
                
                // Verify it's in the observable state
                const qualities = userTopQualities$.peek();
                expect(qualities?.[mockQuality1.id]).toEqual(result.value);
            }
        });

        it('should fail to update non-existent quality', async () => {
            const result = await topQualitiesService.updateTopQuality('non-existent-id', {
                level: 'Low'
            });
            
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('Top quality not found');
            }
        });
    });

    describe('deleteTopQuality', () => {
        it('should delete an existing quality', async () => {
            const result = await topQualitiesService.deleteTopQuality(mockQuality1.id);
            
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(true);
                
                // Verify it's removed from the observable state
                const qualities = userTopQualities$.peek();
                expect(qualities?.[mockQuality1.id]).toBeUndefined();
                expect(qualities?.[mockQuality2.id]).toBeDefined(); // Other quality should remain
            }
        });

        it('should handle deleting non-existent quality', async () => {
            const result = await topQualitiesService.deleteTopQuality('non-existent-id');
            
            expect(result.isOk()).toBe(true);
            if (result.isOk()) {
                expect(result.value).toBe(false);
            }
        });
    });

    describe('clearTopQualities', () => {
        it('should clear all qualities', async () => {
            const result = await topQualitiesService.clearTopQualities();
            
            expect(result.isOk()).toBe(true);
            expect(userTopQualities$.peek()).toBeNull();
        });
    });
}); 