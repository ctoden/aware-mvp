import {withViewModel, ViewModel, getViewModel, initializeViewModel} from '../ViewModel';
import {ok, Result} from "neverthrow";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";

// Define a test ViewModel class
class TestViewModel extends ViewModel {
    protected _initCount = 0;
    constructor() {
        super("TestViewModel");
    }

    public initialize(...args: any): Promise<Result<boolean, Error>> {
        // Simple initialization logic for testing
        this.args = args;
        this._initCount++;
        return Promise.resolve(ok(true));
    }

    get initCount(): number {
        return this._initCount;
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }
    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

    public args: any;
}

describe('ViewModel memoization test', () => {
    it('should memoize the ViewModel instance', async () => {
        // Create a TestViewModel instance with memoization
        const vm1 = await withViewModel(TestViewModel, 'arg1', 'arg2');
        const vm2 = await withViewModel(TestViewModel, 'arg1', 'arg2');
        const vm3 = await withViewModel(TestViewModel, 'arg3', 'arg4');

        // verify that vm1 was only initialized once
        expect(vm1.initCount).toBe(1);

        // Verify that vm1 and vm2 are the same instance (memoized)
        expect(vm1).toBe(vm2);

        // Verify that vm3 is a different instance
        expect(vm1).not.toBe(vm3);

        // Verify the initialization arguments
        expect(vm1.args).toEqual(['arg1', 'arg2']);
        expect(vm3.args).toEqual(['arg3', 'arg4']);
    });

    describe('getViewModel and initializeViewModel tests', () => {
        it('should return memoized instance without initialization using getViewModel', () => {
            const vm1 = getViewModel(TestViewModel, 'test1', 'test2');
            const vm2 = getViewModel(TestViewModel, 'test1', 'test2');
            const vm3 = getViewModel(TestViewModel, 'test3', 'test4');

            // Verify memoization
            expect(vm1).toBe(vm2);
            expect(vm1).not.toBe(vm3);

            // Verify no initialization occurred
            expect(vm1.initCount).toBe(0);
            expect(vm3.initCount).toBe(0);
        });

        it('should properly initialize and memoize using initializeViewModel', async () => {
            const vm1 = getViewModel(TestViewModel, 'init1', 'init2');
            const initializedVm1 = await initializeViewModel(vm1, 'init1', 'init2');
            const initializedVm2 = await initializeViewModel(vm1, 'init1', 'init2');

            // Verify initialization occurred
            expect(initializedVm1.initCount).toBe(1);
            // Verify memoization of initialization
            expect(initializedVm2.initCount).toBe(1);
            // Verify same instance is returned
            expect(initializedVm1).toBe(initializedVm2);
            // Verify args were passed correctly
            expect(initializedVm1.args).toEqual(['init1', 'init2']);
        });

        it('should create different instances for different arguments', async () => {
            const vm1 = getViewModel(TestViewModel, 'diff1', 'diff2');
            const vm2 = getViewModel(TestViewModel, 'diff3', 'diff4');

            const initializedVm1 = await initializeViewModel(vm1, 'diff1', 'diff2');
            const initializedVm2 = await initializeViewModel(vm2, 'diff3', 'diff4');

            // Verify different instances
            expect(vm1).not.toBe(vm2);
            expect(initializedVm1).not.toBe(initializedVm2);

            // Verify correct initialization
            expect(initializedVm1.args).toEqual(['diff1', 'diff2']);
            expect(initializedVm2.args).toEqual(['diff3', 'diff4']);
        });

        it('should maintain consistency between getViewModel and initializeViewModel', async () => {
            const vm1 = getViewModel(TestViewModel, 'consistent1', 'consistent2');
            const vm2 = getViewModel(TestViewModel, 'consistent1', 'consistent2');
            
            const initializedVm1 = await initializeViewModel(vm1, 'consistent1', 'consistent2');
            const initializedVm2 = await initializeViewModel(vm2, 'consistent1', 'consistent2');

            // Verify all references point to the same instance
            expect(vm1).toBe(vm2);
            expect(initializedVm1).toBe(initializedVm2);
            expect(vm1).toBe(initializedVm1);

            // Verify single initialization
            expect(initializedVm1.initCount).toBe(1);
        });
    });
});
