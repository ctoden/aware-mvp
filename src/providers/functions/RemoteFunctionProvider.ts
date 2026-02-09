import { Result } from "neverthrow";
import { LifeCycleManager } from "@src/core/lifecycle/LifeCycleManager";

export const REMOTE_FUNCTION_PROVIDER_KEY = "REMOTE_FUNCTION_PROVIDER_KEY";

export interface IRemoteFunctionProvider extends LifeCycleManager {
    /**
     * Invoke a remote function
     * @param functionName The name of the function to invoke
     * @param args The arguments to pass to the function
     * @returns A Result containing the function response or an error
     */
    invoke<T = any>(functionName: string, args?: Record<string, any>): Promise<Result<T, Error>>;
} 