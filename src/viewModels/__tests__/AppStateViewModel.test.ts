import { DependencyService } from "@src/core/injection/DependencyService";
import { appState$ } from '@src/models/AppStateModel';
import { APP_STATE_PROVIDER_KEY } from '@src/providers/appstate/AppStateProvider';
import { TestAppStateProvider } from '@src/providers/appstate/TestAppStateProvider';
import { nanoid } from "nanoid";
import { AppStateStatus } from 'react-native';
import { AppStateViewModel } from '../AppStateViewModel';
import { withViewModel } from "../ViewModel";

describe('AppStateViewModel', () => {
    let viewModel: AppStateViewModel;
    let testAppStateProvider: TestAppStateProvider;

    beforeEach(async () => {
        // Create and register test provider
        testAppStateProvider = new TestAppStateProvider();
        DependencyService.registerValue(APP_STATE_PROVIDER_KEY, testAppStateProvider);

        // Initialize view model
        viewModel = await withViewModel(AppStateViewModel, nanoid(5));
    });

    afterEach(async () => {
        await viewModel.end();
        appState$.set('active'); // Reset to default state
    });

    describe('initialization', () => {
        it('should initialize successfully', async () => {
            const result = await viewModel.initialize();
            expect(result.isOk()).toBe(true);
        });
    });

    describe('app state access', () => {
        beforeEach(async () => {
            await viewModel.initialize();
        });

        afterEach(async ()=> {
            await viewModel.end();
        })

        it('should provide current app state through getter', () => {
            testAppStateProvider.setState('background');
            expect(viewModel.appState).toBe('background');
            
            testAppStateProvider.setState('active');
            expect(viewModel.appState).toBe('active');
        });

        it('should provide observable app state', () => {
            const states: AppStateStatus[] = [];
            const unsubscribe = viewModel.appState$.onChange((change) => {
                states.push(change.value);
            });

            testAppStateProvider.setState('background');
            testAppStateProvider.setState('active');
            testAppStateProvider.setState('inactive');

            expect(states).toEqual(['background', 'active', 'inactive']);
            unsubscribe();
        });
    });

    describe('cleanup', () => {
        it('should clean up properly on end', async () => {
            const result = await viewModel.end();
            
            expect(result.isOk()).toBe(true);
            
            // Verify state changes don't affect view model after cleanup
            viewModel.appState$.set('background');
            const previousState = viewModel.appState;
            testAppStateProvider.setState('active');
            expect(viewModel.appState).toBe(previousState);
        });
    });
}); 