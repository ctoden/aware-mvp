import {renderHook, act} from '@testing-library/react-native';
import {useViewModel} from '../useViewModel';
import {ViewModel} from '@src/viewModels/ViewModel';
import {injectable} from 'tsyringe';
import {ok, Result} from "neverthrow";
import {LifeCycleConfig} from "@src/core/lifecycle/LifeCycleManager";
import {BR_TRUE} from "@src/utils/NeverThrowUtils";

// Mock ViewModel for testing
@injectable()
class TestViewModel extends ViewModel {
    public value: string;

    constructor() {
        super("TestViewModel");
        this.value = "default";
    }

    public initialize(...args: any[]): Promise<Result<boolean, Error>> {
        this.value = args[0];
        if (this.value === "error") {
            return Promise.reject(new Error("Test error"));
        }
        return Promise.resolve(ok(true));
    }

    protected async onInitialize?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }
    protected async onEnd?(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
        return BR_TRUE;
    }

}

function waitForNextUpdate(): Promise<any> {
    return act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });
}

describe('useViewModel', () => {
    beforeEach(() => {
        // Clear any mocked instances between tests
        jest.clearAllMocks();
    });

    it('should return a ViewModel instance', async () => {
        const {result} = renderHook(() => useViewModel(TestViewModel));

        const {viewModel, error, isInitialized} = result.current;

        expect(viewModel).toBeInstanceOf(TestViewModel);
        expect(error).toBeUndefined();
        expect(isInitialized).toBe(false);

        // Wait for async initialization
        await waitForNextUpdate();

        expect(error).toBeUndefined();
        expect(isInitialized).toBe(false);

        expect(result.current.viewModel).toBeInstanceOf(TestViewModel);
    });

    it('should return the same instance for multiple calls with same constructor and args', async () => {
        const {result: result1} = renderHook(() => useViewModel(TestViewModel, 'test'));
        const {result: result2} = renderHook(() => useViewModel(TestViewModel, 'test'));

        // Wait for async initialization
        await waitForNextUpdate();

        expect(result1.current).toBeTruthy();
        expect(result2.current).toBeTruthy();
        expect(result1.current.viewModel).toBe(result2.current.viewModel);
        expect((result1.current.viewModel as TestViewModel).value).toBe('test');
    });

    it('should return different instances for different args', async () => {
        const {result: result1} = renderHook(() => useViewModel(TestViewModel, 'test1'));
        const {result: result2} = renderHook(() => useViewModel(TestViewModel, 'test2'));

        // Wait for async initialization
        await waitForNextUpdate();

        expect(result1.current).toBeTruthy();
        expect(result2.current).toBeTruthy();
        expect(result1.current).not.toBe(result2.current);
        expect((result1.current.viewModel as TestViewModel).value).toBe('test1');
        expect((result2.current.viewModel as TestViewModel).value).toBe('test2');
    });

    it('should handle async initialization correctly', async () => {
        const {result} = renderHook(() => useViewModel(TestViewModel, 'test3'));

        // Initially should be undefined
        expect(result.current.error).toBeUndefined();
        expect(result.current.isInitialized).toBe(false);
        expect(result.current.viewModel).toBeTruthy();
        expect(result.current.viewModel).toBeInstanceOf(TestViewModel);
        // Wait for async initialization
        await waitForNextUpdate();

        // After initialization should have a value
        expect(result.current.isInitialized).toBe(true);
    });

    it('should handle async initialization with error correctly', async () => {
        const {result} = renderHook(() => useViewModel(TestViewModel, 'error'));

        // Initially should be undefined
        expect(result.current.error).toBeUndefined();
        expect(result.current.isInitialized).toBe(false);
        expect(result.current.viewModel).toBeTruthy();
        expect(result.current.viewModel).toBeInstanceOf(TestViewModel);
        // Wait for async initialization
        await waitForNextUpdate();

        // After initialization should have a value
        expect(result.current.isInitialized).toBe(false);
        expect(result.current.error).toBeTruthy();
        expect(result.current.viewModel).toBeTruthy();
        expect(result.current.viewModel).toBeInstanceOf(TestViewModel);

    });
}); 