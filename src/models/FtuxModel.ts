import { observable } from "@legendapp/state";
import { LifeCycleConfig } from "@src/core/lifecycle/LifeCycleManager";
import { Result, ok } from "neverthrow";
import { Model } from "./Model";
import { singleton } from "tsyringe";
import { ObservableLifecycleManager } from "@src/core/lifecycle/ObservableLifecycleManager";

// Keys for localStorage
export const INTRO_COMPLETED_KEY = 'hasCompletedIntro';
export const FTUX_CURRENT_STEP_KEY = 'ftuxCurrentStep';
export const FTUX_FLOW_COMPLETED_KEY = 'hasCompletedFTUX';

export interface FtuxState {
  hasCompletedIntro: boolean;
  hasCompletedFTUX: boolean;
  currentStep: number;
}

// Create the observable model
export const ftuxState$ = observable<FtuxState>({
  hasCompletedIntro: false,
  hasCompletedFTUX: false,
  currentStep: 0
});

/**
 * FtuxModel - Simple data container for FTUX state
 * Note: All persistence logic has been moved to FtuxService
 */
@singleton()
export class FtuxModel extends Model {
  constructor() {
    super('FtuxModel');
  }

  protected async onInitialize(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    // Initialization is now handled by FtuxService
    return ok(true);
  }

  protected async onEnd(_?: LifeCycleConfig): Promise<Result<boolean, Error>> {
    return ok(true);
  }
} 