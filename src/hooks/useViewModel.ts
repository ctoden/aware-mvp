import {getViewModel, initializeViewModel, ViewModel} from "../viewModels/ViewModel";
import {useEffect, useMemo, useState} from "react";
import {InjectCtor} from "@src/core/injection/Injectable";

// Generic hook to use any ViewModel
export function useViewModel<T extends ViewModel>(
    constructor: InjectCtor<T>,
    ...args: any[]
): { viewModel: T, isInitialized: boolean, error: Error | undefined } {
    // Memoize args to prevent unnecessary re-renders
    const memoizedArgs = useMemo(() => args, [args]);
    const [viewModel] = useState<T>(getViewModel(constructor, ...memoizedArgs));
    const [isInitialized, setIsInitialized] = useState(viewModel.isInitialized.peek());
    const [error, setError] = useState<Error | undefined>(undefined);

    useEffect(() => {
        let isMounted = { value: true }; // To handle cleanup in case the component unmounts
        try {
            if(isInitialized) return;
            initializeViewModel(viewModel, ...memoizedArgs).then(() => {
                if (isMounted.value) {
                    setIsInitialized(true);
                }
            }).catch((error) => {
                console.error(error);
                if (isMounted.value) {
                    setIsInitialized(false);
                    setError(error);
                }
            });
        } catch (e) {
            if (isMounted.value) {
                setIsInitialized(false);
                setError(e as Error);
            }
            console.error(error);
        }
        return () => {
            isMounted.value = false;
        };
    }, [constructor, memoizedArgs]);

    return { viewModel, isInitialized, error };
}