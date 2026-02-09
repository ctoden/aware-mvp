import { AppStateService } from '../AppStateService';
import { DependencyService } from '@src/core/injection/DependencyService';
import { APP_STATE_PROVIDER_KEY } from '@src/providers/appstate/AppStateProvider';
import { TestAppStateProvider } from '@src/providers/appstate/TestAppStateProvider';
import { appState$ } from '@src/models/AppStateModel';
import { AppStateStatus } from 'react-native';

describe('AppStateService', () => {
    let service: AppStateService;
    let testProvider: TestAppStateProvider;

    beforeEach(() => {
        // Create and register test provider
        testProvider = new TestAppStateProvider();
        DependencyService.registerValue(APP_STATE_PROVIDER_KEY, testProvider);

        // Initialize service
        service = new AppStateService();
    });

    afterEach(() => {
        // Clean up
        service.end();
        appState$.set('active'); // Reset to default state
    });

    describe('initialization', () => {
        it('should initialize successfully with registered provider', async () => {
            const result = await service.initialize();
            expect(result.isOk()).toBe(true);
        });

        it('should fail initialization with no provider', async () => {
            // Unregister the provider
            DependencyService.unregister(APP_STATE_PROVIDER_KEY);
            const result = await service.initialize();
            expect(result.isErr()).toBe(true);
            if (result.isErr()) {
                expect(result.error.message).toBe('No app state provider registered');
            }
        });

        it('should set initial state from provider', async () => {
            // Set provider state before initialization
            testProvider.setState('background');
            
            await service.initialize();
            expect(appState$.get()).toBe('background');
        });
    });

    describe('app state changes', () => {
        beforeEach(async () => {
            await service.initialize();
        });

        it('should update observable when app state changes', () => {
            const states: AppStateStatus[] = ['inactive', 'background', 'active'];
            
            states.forEach(state => {
                testProvider.setState(state);
                expect(appState$.get()).toBe(state);
            });
        });

        it('should handle multiple state changes', () => {
            const stateChanges: AppStateStatus[] = ['background', 'active', 'inactive', 'active'];
            
            stateChanges.forEach(state => {
                testProvider.setState(state);
                expect(appState$.get()).toBe(state);
            });
        });
    });

    describe('cleanup', () => {
        it('should clean up subscriptions on end', async () => {
            await service.initialize();
            
            // Get initial subscription count
            const initialSubscriptionCount = testProvider['_callbacks'].size;
            
            await service.end();
            
            // Verify subscription was removed
            expect(testProvider['_callbacks'].size).toBe(initialSubscriptionCount - 1);
            
            // Verify state changes no longer affect observable
            const previousState = appState$.get();
            testProvider.setState('background');
            expect(appState$.get()).toBe(previousState);
        });
    });
}); 