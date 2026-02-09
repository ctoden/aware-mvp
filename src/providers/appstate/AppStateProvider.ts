import { Result } from "neverthrow";
import { AppStateStatus } from "react-native";

export const APP_STATE_PROVIDER_KEY = 'IAppStateProvider';

export type AppStateChangeCallback = (state: AppStateStatus) => void;

export interface IAppStateProvider {
    getCurrentState(): AppStateStatus;
    onAppStateChange(callback: AppStateChangeCallback): { remove: () => void };
    initialize(): Promise<Result<boolean, Error>>;
    end(): Promise<Result<boolean, Error>>;
} 